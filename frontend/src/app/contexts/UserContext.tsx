import * as React from "react";

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

const API_BASE = "/api";

async function apiCall<T>(
  path: string,
  method: string = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

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
      const response = await apiCall<User>("/auth/signup", "POST", {
        name,
        email,
        password,
      });

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
      const response = await apiCall<User>("/auth/signin", "POST", {
        email,
        password,
      });

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
