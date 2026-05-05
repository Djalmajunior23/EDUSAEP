import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../services/errorService';
import { syncFirebaseUserToSupabase } from '../services/supabase/authSyncService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthReady: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resendVerification: () => Promise<void>;
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
    const checkRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        console.error("Error checking redirect result:", err);
      }
    };
    checkRedirect();

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
        // Migration: Ensure role is uppercase
        if (data.role === 'admin' as any) data.role = 'ADMIN';
        if (data.role === 'professor' as any) data.role = 'TEACHER';
        if (data.role === 'aluno' as any) data.role = 'STUDENT';

        // Ensure Djalma is always an admin
        if (user.email === 'djalmabatistajunior@gmail.com') {
          data.role = 'ADMIN';
        }
        setUserProfile(data);
        setIsAuthReady(true);
        
        // Sincronização Híbrida (Firebase -> Supabase)
        syncFirebaseUserToSupabase(user, data).catch(err => 
          console.warn("Supabase Sync Error:", err)
        );
      } else {
        // Create profile if it doesn't exist
        const isFirstUser = user.email === 'djalmabatistajunior@gmail.com';
        const newProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email || '',
          role: isFirstUser ? 'ADMIN' : 'STUDENT',
          displayName: user.displayName || user.email?.split('@')[0] || 'Aluno',
          createdAt: new Date().toISOString(),
          xp: 0,
          level: 1,
          badges: [],
          settings: {
            theme: 'light',
            notifications: true,
            language: 'pt-BR'
          }
        };

        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
        } catch (err) {
          console.error("Error creating user profile:", err);
          setUserProfile(newProfile as UserProfile);
          setIsAuthReady(true);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      setIsAuthReady(true);
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

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      if (name) {
        await updateProfile(user, { displayName: name });
      }
      await sendEmailVerification(user);
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error) {
        console.error("Error resending verification:", error);
        throw error;
      }
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

  const isAdmin = userProfile?.role === 'ADMIN';
  const isProfessor = userProfile?.role === 'TEACHER' || userProfile?.role === 'COORDINATOR' || isAdmin;
  const isAluno = userProfile?.role === 'STUDENT' || userProfile?.role === 'MONITOR';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAuthReady, 
      loginWithGoogle, 
      loginWithEmail,
      registerWithEmail,
      resendVerification,
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
