import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { fetchUserProfile, logoutUser } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  role: UserRole | null;
  isStaffOrAdmin: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  role: null,
  isStaffOrAdmin: false,
  isAdmin: false,
  refreshUser: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await fetchUserProfile(fbUser.uid, fbUser.email);
      setUser(profile);
    } catch (e) {
      console.error('Failed to load user profile in AuthProvider:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await loadProfile(fbUser);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (firebaseUser) {
      await loadProfile(firebaseUser);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isStaffOrAdmin = role === 'ADMIN' || role === 'STAFF';

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isLoading,
      role,
      isStaffOrAdmin,
      isAdmin,
      refreshUser,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
