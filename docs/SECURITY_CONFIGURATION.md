# Configuración de Seguridad - SEIA

## 🔐 Descripción General

SEIA implementa múltiples capas de seguridad para proteger las evaluaciones académicas y los datos sensibles. Este documento describe las medidas de seguridad implementadas y su configuración.

## 🛡️ Capas de Seguridad

### 1. **Autenticación y Autorización**

#### NextAuth.js Configuration
```typescript
// src/auth.ts
- Proveedores: Credentials y Google OAuth
- Estrategia de sesión: JWT
- Duración de sesión: 30 días
- Cookies seguras en producción
```

#### Middleware de Protección de Rutas
```typescript
// src/middleware.ts
- Protección de rutas /admin y /teacher
- Verificación de roles por ruta
- Redirección automática a login
- Manejo de tokens JWT
```

### 2. **Encriptación de Datos Sensibles**

#### Sistema de Encriptación
```typescript
// src/lib/crypto.ts
- Algoritmo: AES-256-GCM
- Clave de encriptación: ENCRYPTION_KEY (env)
- Datos encriptados: API Keys de Gemini
- Funciones: encrypt() y decrypt()
```

#### Datos Protegidos
- API Keys de Google Gemini (global y por usuario)
- Configuraciones sensibles del sistema
- Tokens de acceso a servicios externos

### 3. **Seguridad de Evaluaciones**

#### Directorio Ofuscado para Estudiantes
```
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/
```
- **Propósito**: Ocultar rutas de estudiantes
- **Beneficio**: Dificulta acceso no autorizado
- **Contenido**: Interfaz de evaluación completa

#### Hooks de Seguridad Anti-Fraude
```typescript
// Hooks implementados:
- usePageVisibility: Detecta cambios de pestaña
- useEvaluationTimer: Control estricto de tiempo
- useStudentData: Validación de identidad
```

### 4. **Configuración de Base de Datos**

#### Prisma Security
```prisma
// Relaciones con CASCADE DELETE
- Protección de integridad referencial
- Eliminación automática de datos relacionados
- Validación de tipos estricta
```

#### Conexión Segura
```env
DATABASE_URL="postgresql://..." # Supabase con SSL
- Conexión pooling habilitada
- SSL mode requerido
- Credenciales encriptadas
```

## 🔧 Variables de Entorno Críticas

### Autenticación
```env
AUTH_SECRET=whsec_b7UMsOp5qP1QcYV/T7hWUJTvoD1IDyO+
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Encriptación
```env
ENCRYPTION_KEY=zRXkQ0Sz1dhUvC72OjYvZR6C2Up6WL6E
```

### Base de Datos
```env
DATABASE_URL="postgresql://postgres.fanlbwoqpulnwugvyapv:seia1234567890@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### OAuth (Opcional)
```env
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
```

## 🚀 Configuración de Producción

### Vercel Security Headers
```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ]
}
```

### Cookies Seguras
```typescript
// Configuración automática por entorno
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

## 🔍 Monitoreo de Seguridad

### Logs de Autenticación
- Intentos de login fallidos
- Accesos a rutas protegidas
- Cambios de roles y permisos

### Detección de Anomalías
- Múltiples intentos de acceso
- Cambios frecuentes de pestaña durante evaluaciones
- Acceso desde dispositivos no reconocidos

## 🛠️ Mejores Prácticas

### Para Desarrolladores
1. **Nunca** commitear claves en el código
2. Usar variables de entorno para datos sensibles
3. Validar entrada en cliente Y servidor
4. Implementar rate limiting en APIs críticas

### Para Administradores
1. Rotar claves de API regularmente
2. Monitorear logs de acceso
3. Configurar alertas de seguridad
4. Mantener dependencias actualizadas

## 🚨 Consideraciones de Seguridad

### Limitaciones Actuales
- No hay rate limiting implementado
- Falta 2FA para administradores
- No hay logs de auditoría centralizados

### Mejoras Recomendadas
- Implementar rate limiting con Redis
- Añadir autenticación de dos factores
- Sistema de logs de auditoría
- Monitoreo de integridad de archivos

---

**Última actualización**: Enero 2025  
**Versión**: 1.0  
**Estado**: Implementado y funcional