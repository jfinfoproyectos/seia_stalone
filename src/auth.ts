import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { compare } from "bcrypt"
import type { Roles } from "@/types/globals"

// Verificar variables de entorno críticas
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not set in environment variables');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          
          const email = credentials.email as string;
          const password = credentials.password as string;
          
          const user = await prisma.user.findUnique({
            where: { email: email },
          });

          if (!user) {
            return null;
          }

          if (!user.hashedPassword) {
            return null;
          }
          
          const isPasswordValid = await compare(password, user.hashedPassword);
          
          if (!isPasswordValid) {
            return null;
          }
          
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.firstName || 'Usuario',
            role: user.role,
          };
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      try {
        if (token.sub && session.user) {
          session.user.id = token.sub;
          
          // Si ya tenemos el rol en el token, usarlo directamente
          if (token.role) {
            session.user.role = token.role as Roles;
          } else {
            // Si no, buscar en la base de datos
            const user = await prisma.user.findUnique({
              where: { id: parseInt(token.sub) },
            });
            
            if (user && (user.role === 'ADMIN' || user.role === 'TEACHER')) {
              session.user.role = user.role as Roles;
              // Actualizar el token para futuras sesiones
              token.role = user.role as Roles;
            }
          }
        }
        
        return session;
      } catch {
        return session;
      }
    },
    async jwt({ token, user, trigger }) {
      try {
        // Si es un nuevo login (user está presente)
        if (user) {
          const userRole = user.role;
          if (userRole === 'ADMIN' || userRole === 'TEACHER') {
            token.role = userRole as Roles;
          }
        }
        
        // Si es una actualización de sesión, verificar que el rol siga siendo válido
        if (trigger === 'update' && token.sub) {
          const user = await prisma.user.findUnique({
            where: { id: parseInt(token.sub) },
          });
          
          if (user && (user.role === 'ADMIN' || user.role === 'TEACHER')) {
            token.role = user.role as Roles;
          } else {
            // Si el usuario ya no tiene un rol válido, limpiar el token
            delete token.role;
          }
        }
        
        return token;
      } catch {
        return token;
      }
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true, // Importante para Vercel
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)