import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useLoginUser, 
  useRegisterUser, 
  getCurrentUser,
  type User,
  type LoginRequest,
  type RegisterRequest
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("arogya_token");
      if (token) {
        try {
          // Assuming customFetch uses the token from localStorage
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed", error);
          localStorage.removeItem("arogya_token");
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("arogya_token", res.token);
      setUser(res.user);
      setLocation("/");
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "Please check your credentials." 
      });
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const res = await registerMutation.mutateAsync({ data });
      localStorage.setItem("arogya_token", res.token);
      setUser(res.user);
      setLocation("/");
      toast({ title: "Account Created", description: "Welcome to ArogyaMitra!" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: error.message || "Could not create account." 
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("arogya_token");
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
