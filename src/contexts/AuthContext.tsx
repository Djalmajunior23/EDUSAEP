import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../services/errorService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthReady: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isProfessor: boolean;
  isAluno: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure Djalma is always an admin in the frontend, even if the DB hasn't updated yet
        if (user.email === 'djalmabatistajunior@gmail.com') {
          data.role = 'admin';
        }
        // Auto-populate matricula if missing
        if (!data.matricula && user.email) {
          data.matricula = user.email.substring(0, 10);
        }
        setUserProfile(data);
        setIsAuthReady(true);
      } else {
        // Create profile if it doesn't exist
        const isFirstUser = user.email === 'djalmabatistajunior@gmail.com';
        const newProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email || '',
          role: isFirstUser ? 'admin' : 'aluno',
          matricula: user.email?.substring(0, 10) || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Aluno',
          createdAt: new Date().toISOString(),
          xp: 0,
          level: 1,
          badges: []
        };

        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
          // The onSnapshot will trigger again and set the profile
        } catch (err) {
          console.error("Error creating user profile:", err);
          // Fallback in case of error (e.g. permission denied before rules are updated)
          setUserProfile(newProfile as UserProfile);
          setIsAuthReady(true);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      setIsAuthReady(true); // Ensure app doesn't hang on error
    });

    return () => unsubscribe();
  }, [user]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isProfessor = userProfile?.role === 'professor' || isAdmin;
  const isAluno = userProfile?.role === 'aluno';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAuthReady, 
      loginWithGoogle, 
      logout,
      isAdmin,
      isProfessor,
      isAluno
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
