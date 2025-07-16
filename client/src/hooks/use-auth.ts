import { useState, useEffect } from "react";
import { authService, type AuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Error obteniendo usuario:", error);
          authService.setToken("");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { token, user } = await authService.login(username, password);
      authService.setToken(token);
      setUser(user);
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${user.nombre}`,
      });
      return true;
    } catch (error: any) {
      console.error("Error en login:", error);
      const errorMessage = error.message || "Credenciales inválidas";
      toast({
        title: "Error de autenticación",
        description: errorMessage.includes("401") ? "Usuario o contraseña incorrectos" : errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      console.error("Error en logout:", error);
      setUser(null);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
