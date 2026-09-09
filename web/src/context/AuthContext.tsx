import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, usersService } from '../services';
import { LoginCredentials, RegisterPayload, UserProfile, UserSession } from '../types';

interface AuthContextType {
  session: UserSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemoUser: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        if (currentSession) {
          setSession(currentSession);
          const userProf = await usersService.getProfile(currentSession.id);
          setProfile(userProf);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    void initAuth();
  }, []);

  const refreshProfile = async () => {
    if (session) {
      const userProf = await usersService.getProfile(session.id);
      setProfile(userProf);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const newSession = await authService.login(credentials);
      setSession(newSession);
      const userProf = await usersService.getProfile(newSession.id);
      setProfile(userProf);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const newSession = await authService.register(payload);
      setSession(newSession);
      const userProf = await usersService.getProfile(newSession.id);
      setProfile(userProf);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setSession(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async () => {
    await login({ email: 'demo@example.com', password: 'secret123' });
  };

  const loginAsDemoAdmin = async () => {
    await login({ email: 'demo@example.com', password: 'secret123' });
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        login,
        register,
        logout,
        loginAsDemoUser,
        loginAsDemoAdmin,
        refreshProfile,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
