import { useState, useEffect } from "react";
import { getCurrentUser, login, register, logout, type AuthUser, type LoginData, type RegisterData } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async (data: LoginData) => {
    setIsLoggingIn(true);
    try {
      const user = await login(data);
      setUser(user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      return user;
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const registerUser = async (data: RegisterData) => {
    setIsRegistering(true);
    try {
      const user = await register(data);
      setUser(user);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      return user;
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "Registration failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isLoggingIn,
    isRegistering,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    isAuthenticated: !!user,
  };
}
