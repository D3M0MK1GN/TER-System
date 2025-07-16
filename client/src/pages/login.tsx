import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Antenna, User, Lock, LogIn, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(username, password);
    if (success) {
      setLocation("/dashboard");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Antenna className="text-primary text-2xl h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Sistema de Gestión
          </CardTitle>
          <p className="text-gray-600">Solicitudes de Telecomunicaciones</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="mr-2 h-4 w-4" />
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lock className="mr-2 h-4 w-4" />
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Recordarme
                </Label>
              </div>
              <Button variant="link" className="text-sm text-primary hover:underline p-0">
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-blue-700 transition-colors duration-200"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <Shield className="inline mr-1 h-4 w-4" />
            Sistema seguro - Una sesión por usuario
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
