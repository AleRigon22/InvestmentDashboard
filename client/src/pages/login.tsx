import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ChartLine } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, user } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        await register({ username: username.trim(), password });
        setLocation("/dashboard"); // Redirect after successful registration
      } else {
        await login({ username: username.trim(), password });
        setLocation("/dashboard"); // Redirect after successful login
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Tracker</h1>
            <p className="text-gray-600 mt-2">Manage your investments manually</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className="w-full bg-primary hover:bg-primary-700 text-white py-3 px-4 rounded-lg transition-all font-medium"
            >
              {isLoading ? "Loading..." : isRegistering ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              {isRegistering ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-primary hover:text-primary-700 font-medium"
              >
                {isRegistering ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
