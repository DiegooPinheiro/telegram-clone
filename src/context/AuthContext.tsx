import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthChange,
  getCurrentUser,
  getCurrentUserProfile,
  resolveUserProfileForFirebaseUid,
} from '../services/authService';
import { getChatSession } from '../services/chatSession';
import { UserProfile } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  phoneVerified: boolean;
  requiresTwoStepLogin: boolean;
  isAuthenticated: boolean;
  uid: string | null;
  firebaseUid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  userProfile: UserProfile | null;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [requiresTwoStepLogin, setRequiresTwoStepLogin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);

  const checkSession = async () => {
    const session = await getChatSession();
    setPhoneVerified(!!session?.phoneVerified);
    setProfileUid((current) => session?.profileUid || current);
  };

  const refreshSession = async () => {
    await checkSession();

    if (!user) return;

    try {
      const session = await getChatSession();
      if (session?.phoneVerified) {
        setRequiresTwoStepLogin(false);
      }

      const profile = await getCurrentUserProfile(session?.profileUid || profileUid);
      if (profile) {
        setUserProfile(profile);
        setProfileUid(profile.uid);
      }
    } catch (e) {
      console.error('[AuthContext] Erro ao recarregar perfil apos refresh da sessao:', e);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const session = await getChatSession();
      const profile = await getCurrentUserProfile(profileUid || session?.profileUid);
      if (profile) {
        setUserProfile(profile);
        setProfileUid(profile.uid);
      }
    } catch (e) {
      console.error('[AuthContext] Erro ao atualizar perfil:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const session = await getChatSession();
        const isLocalSessionVerified = !!session?.phoneVerified;

        setProfileUid(session?.profileUid || null);
        setPhoneVerified(isLocalSessionVerified);
        if (isLocalSessionVerified) {
          setRequiresTwoStepLogin(false);
        }

        try {
          const profile = await resolveUserProfileForFirebaseUid(firebaseUser.uid, session?.profileUid);

          if (profile) {
            setUserProfile(profile);
            setProfileUid(profile.uid);

            if (profile.phoneVerified) {
              if (!profile.twoStepEnabled || isLocalSessionVerified) {
                setPhoneVerified(true);
                setRequiresTwoStepLogin(false);
              } else {
                setPhoneVerified(false);
                setRequiresTwoStepLogin(true);
              }
            } else {
              setPhoneVerified(false);
              setRequiresTwoStepLogin(false);
            }
          } else {
            setUserProfile(null);
            if (!isLocalSessionVerified) {
              setPhoneVerified(false);
              setRequiresTwoStepLogin(false);
            }
          }
        } catch (e) {
          console.error('[AuthContext] Erro ao buscar perfil:', e);
        }
      } else {
        setPhoneVerified(false);
        setRequiresTwoStepLogin(false);
        setUserProfile(null);
        setProfileUid(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (user && !phoneVerified) {
      interval = setInterval(checkSession, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, phoneVerified]);

  const value = {
    user,
    loading,
    phoneVerified,
    requiresTwoStepLogin,
    isAuthenticated: !!user,
    uid: profileUid || userProfile?.uid || null,
    firebaseUid: user?.uid || null,
    displayName: userProfile?.displayName || user?.displayName || null,
    email: userProfile?.email || user?.email || null,
    photoURL: userProfile?.photoURL || user?.photoURL || null,
    userProfile,
    refreshSession,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
