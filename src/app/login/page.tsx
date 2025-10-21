'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  // const router = useRouter(); // Comentado porque no se usa actualmente
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Asegurar que el componente esté montado y el tema cargado
  useEffect(() => {
    setMounted(true);
    // Con multitema eliminado, el login puede renderizar de inmediato
    setThemeLoaded(true);
  }, []);

  // Efecto para redirigir si el usuario ya está autenticado
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const session = await getSession();
      if (session?.user?.role) {
        if (session.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else if (session.user.role === 'TEACHER') {
          window.location.href = '/teacher';
        }
      }
    };

    // Check authentication status after a short delay
    const timer = setTimeout(checkAuthAndRedirect, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      // Primero verificar si fue exitoso
      if (result?.ok) {
        // Wait longer for the session to be established and cookies to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a page reload to ensure cookies are properly set
        window.location.reload();
        
        return; // Exit here as the page will reload
      } else if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } else {
          setError(`Error de autenticación: ${result.error}`);
        }
      } else {
        setError('Ocurrió un error inesperado durante el inicio de sesión.');
      }
    } catch {
      setError('Error del sistema. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // No renderizar hasta que esté montado y el tema cargado
  if (!mounted || !themeLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <div className="flex items-center gap-3 p-3 rounded-full bg-primary/10">
                <PenTool className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  SEIAC
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema de evaluación
              </CardDescription>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-8">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base bg-background border-border focus:border-primary/50 focus:ring-ring transition-colors"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base bg-background border-border focus:border-primary/50 focus:ring-ring transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter className="px-8 pt-6 pb-8">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema de Evaluación con Inteligencia Artificial
          </p>
        </div>
      </div>
    </div>
  );
}