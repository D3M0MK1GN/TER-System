import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, type AuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      if (!authService.isAuthenticated()) {
        return null;
      }
      try {
        return await authService.getCurrentUser();
      } catch (error: any) {
        console.error("Error obteniendo usuario:", error);
        // Clear token on authentication errors
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          localStorage.removeItem("token");
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
    enabled: authService.isAuthenticated(),
  });

  const login = async (username: string, password: string) => {
    try {
      const { token, user } = await authService.login(username, password);
      authService.setToken(token);
      
      // Update the cache with the user data
      queryClient.setQueryData(['/api/auth/me'], user);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${user.nombre}`,
      });
      return true;
    } catch (error: any) {
      console.error("Error en login:", error);
      const errorMessage = error.message || "Credenciales inválidas";
      // Show specific suspension/blocking messages
      if (errorMessage.includes("Cuenta Suspendida") || errorMessage.includes("Cuenta Bloqueada")) {
        toast({
          title: "Acceso restringido",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: errorMessage.includes("401") ? "Usuario o contraseña incorrectos" : errorMessage,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      queryClient.clear(); // Clear all queries
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      console.error("Error en logout:", error);
      queryClient.clear(); // Clear all queries even on error
    }
  };

  return {
    user: user || null,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
