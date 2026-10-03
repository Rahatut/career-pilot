import * as React from "react";
import { signIn as apiSignIn, signUp as apiSignUp } from "../../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface UserContextValue {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const UserContext = React.createContext<UserContextValue | null>(null);

// ─── UserProvider ─────────────────────────────────────────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check if user is logged in on mount
  React.useEffect(() => {
    const token = localStorage.getItem("cp_token");
    const userStr = localStorage.getItem("cp_user");
    
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (err) {
        localStorage.removeItem("cp_token");
        localStorage.removeItem("cp_user");
      }
    }
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiSignUp(name, email, password);

      setUser(response);
      localStorage.setItem("cp_user", JSON.stringify(response));
      localStorage.setItem("cp_token", response.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiSignIn(email, password);

      setUser(response);
      localStorage.setItem("cp_user", JSON.stringify(response));
      localStorage.setItem("cp_token", response.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setError(null);
      localStorage.removeItem("cp_token");
      localStorage.removeItem("cp_user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, signIn, signUp, signOut, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── hooks ────────────────────────────────────────────────────────────────────
export function useUser(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
}
