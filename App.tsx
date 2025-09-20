import React, { useState, useEffect, createContext, useContext, FC } from 'react';
import { auth, db, storage, serverTimestamp } from './firebase';
// FIX: Replaced named imports from 'firebase/auth' with a namespace import to resolve module loading errors.
import * as firebaseAuth from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    DocumentData
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';


// --- 2. AUTHENTICATION CONTEXT ---
interface AuthContextType {
    // FIX: Using User type from firebaseAuth namespace.
    currentUser: firebaseAuth.User | null;
    loading: boolean;
}
const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const AuthProvider: FC<{children: React.ReactNode}> = ({ children }) => {
    // FIX: Using User type from firebaseAuth namespace.
    const [currentUser, setCurrentUser] = useState<firebaseAuth.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // FIX: Using onAuthStateChanged from firebaseAuth namespace.
        const unsubscribe = firebaseAuth.onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


// --- 3. COMPONENTS ---

// --- Navbar Component ---
const Navbar: FC<{ setPage: (page: string) => void, activePage: string }> = ({ setPage, activePage }) => {
    const { currentUser } = useAuth();
    
    const handleLogout = async () => {
        try {
            // FIX: Using signOut from firebaseAuth namespace.
            await firebaseAuth.signOut(auth);
            setPage('auth');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };
    
    return (
        <nav className="navbar">
            <div className="logo">Edge<span>Plus</span></div>
            <div className="nav-links">
                {currentUser ? (
                    <>
                        <button onClick={() => setPage('dashboard')} className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
                        <button onClick={() => setPage('profile')} className={`nav-link ${activePage === 'profile' ? 'active' : ''}`}>Profile</button>
                        <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
                    </>
                ) : (
                    <button onClick={() => setPage('auth')} className={`nav-link ${activePage === 'auth' ? 'active' : ''}`}>Login / Signup</button>
                )}
            </div>
        </nav>
    );
};

// --- Authentication Page Component ---
const AuthPage: FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (isLogin) {
                // FIX: Using signInWithEmailAndPassword from firebaseAuth namespace.
                await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
            } else {
                // FIX: Using createUserWithEmailAndPassword from firebaseAuth namespace.
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        name: name,
                        email: user.email,
                        createdAt: serverTimestamp(),
                        photoURL: '',
                    });
                }
            }
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                 <div className="logo">Edge<span>Plus</span></div>
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="auth-toggle-link">
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};

// --- Dashboard Page Component ---
const Dashboard: FC = () => {
    const { currentUser } = useAuth();
    const [userName, setUserName] = useState('');
    
    useEffect(() => {
        if (currentUser) {
            const fetchUserData = async () => {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserName(docSnap.data()?.name);
                }
            };
            fetchUserData();
        }
    }, [currentUser]);
    
    return (
        <div className="container">
            <h1 className="page-title">Dashboard</h1>
            <div className="card">
                <h2>Welcome, {userName || 'User'}!</h2>
                <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>This is your main dashboard. Your charts and financial data will be displayed here.</p>
            </div>
        </div>
    );
};

// --- Profile Page Component ---
const Profile: FC = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<DocumentData | null>(null);
    const [newName, setNewName] = useState('');
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserData(data || null);
                    setNewName(data?.name || '');
                }
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser && newName.trim() !== '') {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, { name: newName });
            setUserData(prev => prev ? { ...prev, name: newName } : null);
            alert("Name updated successfully!");
        }
    };
    
    const handlePictureUpload = async (file: File) => {
        if (currentUser) {
            setUploading(true);
            const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, { photoURL });
            
            setUserData(prev => prev ? { ...prev, photoURL } : null);
            setUploading(false);
            setProfilePic(null);
            alert("Profile picture updated!");
        }
    };
    
    useEffect(() => {
      if (profilePic) {
        handlePictureUpload(profilePic);
      }
    }, [profilePic]);

    if (loading) return <div className="loading-spinner"></div>;

    const avatar = userData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${userData?.name || 'User'}`;

    return (
        <div className="container">
            <h1 className="page-title">Your Profile</h1>
            <div className="card">
                <div className="profile-header">
                    <img src={avatar} alt="Profile" className="profile-avatar"/>
                    <div className="profile-info">
                        <h2>{userData?.name}</h2>
                        <p>{userData?.email}</p>
                        <div className="profile-pic-upload">
                            <label htmlFor="photo-upload" className="upload-label">
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </label>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files && setProfilePic(e.target.files[0])}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleNameUpdate} style={{marginTop: '2rem'}}>
                     <div className="form-group">
                        <label htmlFor="profileName">Update Your Name</label>
                        <input
                            id="profileName"
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="submit-btn" style={{maxWidth: '200px'}}>Save Changes</button>
                </form>
            </div>
        </div>
    );
};


// --- 4. MAIN APP ---
const AppContent: FC = () => {
    const { currentUser, loading } = useAuth();
    const [page, setPage] = useState('dashboard');
    
    useEffect(() => {
        if (!loading) {
            if (currentUser) {
                setPage('dashboard');
            } else {
                setPage('auth');
            }
        }
    }, [currentUser, loading]);
    
    if (loading) {
        return <div className="loading-spinner"></div>;
    }
    
    const renderPage = () => {
        if (!currentUser) return <AuthPage />;
        
        switch (page) {
            case 'dashboard': return <Dashboard />;
            case 'profile': return <Profile />;
            default: return <Dashboard />;
        }
    };

    return (
        <>
            <Navbar setPage={setPage} activePage={page} />
            {renderPage()}
        </>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}