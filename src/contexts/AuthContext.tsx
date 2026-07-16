import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  type AuthSession,
} from 'aws-amplify/auth';
import { awsConfig } from '../aws-config';

Amplify.configure(awsConfig);

interface CognitoUser {
  userId: string;
  username: string;
  email?: string;
}

type AuthErrorResult = { message: string } | null;

interface AuthContextType {
  user: CognitoUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: AuthErrorResult; needsConfirmation?: boolean }>;
  confirmEmail: (email: string, code: string) => Promise<{ error: AuthErrorResult }>;
  resendConfirmationCode: (email: string) => Promise<{ error: AuthErrorResult }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthErrorResult; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId,
      });
      setSession(session);
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const userAttributes: Record<string, string> = { email, name: fullName };
      if (phone?.trim()) userAttributes.phone_number = phone.trim();
      await amplifySignUp({
        username: email,
        password,
        options: { userAttributes },
      });
      return { error: null, needsConfirmation: true };
    } catch (err: unknown) {
      return { error: { message: err instanceof Error ? err.message : 'Sign up failed' } };
    }
  };

  const confirmEmail = async (email: string, code: string) => {
    try {
      await amplifyConfirmSignUp({ username: email, confirmationCode: code });
      return { error: null };
    } catch (err: unknown) {
      return { error: { message: err instanceof Error ? err.message : 'Verification failed' } };
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
      return { error: null };
    } catch (err: unknown) {
      return { error: { message: err instanceof Error ? err.message : 'Could not resend code' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await amplifySignIn({ username: email, password });
      // Cognito can require email confirmation before first sign-in
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        return { error: null, needsConfirmation: true };
      }
      await checkUser();
      return { error: null };
    } catch (err: unknown) {
      return { error: { message: err instanceof Error ? err.message : 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    confirmEmail,
    resendConfirmationCode,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
