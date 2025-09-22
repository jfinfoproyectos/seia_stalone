import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Get the token from the request with multiple cookie name attempts
    let token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    });

    // If no token found, try alternative cookie name
    if (!token) {
      token = await getToken({ 
        req: request, 
        secret: process.env.AUTH_SECRET,
        cookieName: 'next-auth.session-token'
      });
    }

    // Also check for __Secure version in development (fallback)
    if (!token) {
      token = await getToken({ 
        req: request, 
        secret: process.env.AUTH_SECRET,
        cookieName: '__Secure-next-auth.session-token'
      });
    }

    // Rutas públicas que no requieren autenticación
    const publicPaths = [
      '/login', 
      '/api/auth',
      '/', // Página principal es pública
      '/student' // Rutas de estudiante son públicas
    ];
    const isPublicPath = publicPaths.some(path => 
      path === '/' ? pathname === '/' : pathname.startsWith(path)
    );

    // Si es una ruta pública, permitir acceso
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Rutas que requieren autenticación (solo admin y teacher)
    const protectedPaths = ['/admin', '/teacher'];
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // Si no es una ruta protegida, permitir acceso (otras rutas públicas)
    if (!isProtectedPath) {
      return NextResponse.next();
    }

    // Para rutas protegidas, verificar autenticación
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar roles para rutas específicas protegidas
    const userRole = token.role as string | undefined;

    // Rutas de administrador - solo ADMIN
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'ADMIN') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'AccessDenied');
        return NextResponse.redirect(loginUrl);
      }
    }

    // Rutas de profesor - TEACHER o ADMIN
    if (pathname.startsWith('/teacher')) {
      // Verificar si el usuario tiene el rol de TEACHER o ADMIN
      if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'AccessDenied');
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch {
    // En caso de error, redirigir al login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'SystemError');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};