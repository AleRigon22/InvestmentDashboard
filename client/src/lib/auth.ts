import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  username: string;
  portfolioName?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
}

export async function login(data: LoginData): Promise<AuthUser> {
  try {
    const response = await apiRequest("POST", "/api/auth/login", data);
    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Invalid credentials");
  }
}

export async function register(data: RegisterData): Promise<AuthUser> {
  try {
    const response = await apiRequest("POST", "/api/auth/register", data);
    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error("Registration failed");
  }
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/me");
    const result = await response.json();
    return result.user;
  } catch (error) {
    return null;
  }
}
