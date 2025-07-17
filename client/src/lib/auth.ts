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
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });
    return response;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("token");
    if (token) {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    }
    localStorage.removeItem("token");
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiRequest("/api/auth/me");
    return response;
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
