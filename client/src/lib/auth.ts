import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  username: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });
    return response.json();
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("token");
    if (token) {
      await apiRequest("POST", "/api/auth/logout");
    }
    localStorage.removeItem("token");
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  setToken(token: string): void {
    localStorage.setItem("token", token);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
