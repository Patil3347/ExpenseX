
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check for existing user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // This is a mock authentication - in a real app, this would validate against a backend
      if (email && password) {
        // Check if user exists in localStorage (mock registration)
        const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const foundUser = registeredUsers.find((u: any) => u.email === email);
        
        if (!foundUser || foundUser.password !== password) {
          throw new Error("Invalid email or password");
        }
        
        // Remove password from user object
        const { password: _, ...userWithoutPassword } = foundUser;
        
        // Set user in state and localStorage
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Signed in successfully",
          description: `Welcome back, ${userWithoutPassword.name}!`,
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error.message || "Failed to sign in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      // This is a mock registration - in a real app, this would create a user in a backend
      if (email && password && name) {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const existingUser = users.find((u: any) => u.email === email);
        
        if (existingUser) {
          throw new Error("User with this email already exists");
        }
        
        // Create new user
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password, // In a real app, this would be hashed
          name,
          avatar: "",
        };
        
        // Add user to "database"
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        
        // Remove password from user object before storing in state
        const { password: _, ...userWithoutPassword } = newUser;
        
        // Set user in state and localStorage
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Account created successfully",
          description: `Welcome, ${name}!`,
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

// Handler for private routes
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : null;
}
