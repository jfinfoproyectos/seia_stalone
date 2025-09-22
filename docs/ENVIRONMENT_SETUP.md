# Configuración de Variables de Entorno - SEIA

## 🌍 Descripción General

Este documento describe todas las variables de entorno necesarias para configurar y ejecutar SEIA correctamente en diferentes entornos (desarrollo, staging, producción).

## 📋 Variables Requeridas

### 🗄️ **Base de Datos**

#### DATABASE_URL (Requerida)
```env
DATABASE_URL="postgresql://postgres.fanlbwoqpulnwugvyapv:seia1234567890@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```
- **Descripción**: URL de conexión a PostgreSQL
- **Proveedor**: Supabase (recomendado)
- **Formato**: `postgresql://usuario:contraseña@host:puerto/database`
- **Notas**: Debe incluir SSL mode para producción

#### DIRECT_URL (Opcional)
```env
DIRECT_URL="postgresql://postgres.fanlbwoqpulnwugvyapv:contraseña@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```
- **Descripción**: Conexión directa para migraciones
- **Uso**: Prisma migrations y operaciones administrativas

### 🔐 **Autenticación**

#### AUTH_SECRET (Requerida)
```env
AUTH_SECRET=whsec_b7UMsOp5qP1QcYV/T7hWUJTvoD1IDyO+
```
- **Descripción**: Clave secreta para JWT de NextAuth.js
- **Generación**: `npx auth secret`
- **Longitud**: Mínimo 32 caracteres
- **Seguridad**: Debe ser única por entorno

#### AUTH_URL (Requerida)
```env
# Desarrollo
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Producción
AUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_URL=https://tu-dominio.vercel.app
```
- **Descripción**: URL base de la aplicación
- **Uso**: Callbacks de OAuth y redirecciones
- **Importante**: Debe coincidir con el dominio real

### 🔒 **Encriptación**

#### ENCRYPTION_KEY (Requerida)
```env
ENCRYPTION_KEY=zRXkQ0Sz1dhUvC72OjYvZR6C2Up6WL6E
```
- **Descripción**: Clave para encriptar datos sensibles
- **Algoritmo**: AES-256-GCM
- **Longitud**: Exactamente 32 caracteres
- **Uso**: Encriptación de API Keys de Gemini

### 🤖 **Google OAuth (Opcional)**

#### GOOGLE_CLIENT_ID
```env
GOOGLE_CLIENT_ID=tu_client_id_de_google.apps.googleusercontent.com
```
- **Descripción**: ID de cliente de Google OAuth
- **Obtención**: Google Cloud Console
- **Uso**: Login con Google (opcional)

#### GOOGLE_CLIENT_SECRET
```env
GOOGLE_CLIENT_SECRET=GOCSPX-tu_client_secret_de_google
```
- **Descripción**: Secreto de cliente de Google OAuth
- **Seguridad**: Mantener confidencial
- **Uso**: Autenticación con Google

## 🔧 Configuración por Entorno

### 🛠️ **Desarrollo Local**

Crear archivo `.env.local`:
```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/seia_dev"

# Autenticación
AUTH_SECRET=tu_clave_secreta_de_desarrollo_32_chars
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Encriptación
ENCRYPTION_KEY=clave_de_32_caracteres_para_dev

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_client_id_dev
GOOGLE_CLIENT_SECRET=tu_client_secret_dev
```

### 🧪 **Staging/Testing**

```env
# Base de datos
DATABASE_URL="postgresql://usuario:pass@staging-host:5432/seia_staging"

# Autenticación
AUTH_SECRET=clave_secreta_staging_diferente_32_chars
AUTH_URL=https://seia-staging.vercel.app
NEXTAUTH_URL=https://seia-staging.vercel.app

# Encriptación
ENCRYPTION_KEY=clave_staging_32_caracteres_unica

# Google OAuth
GOOGLE_CLIENT_ID=client_id_staging
GOOGLE_CLIENT_SECRET=client_secret_staging
```

### 🚀 **Producción**

```env
# Base de datos (Supabase)
DATABASE_URL="postgresql://postgres.hash:password@aws-region.pooler.supabase.com:5432/postgres"

# Autenticación
AUTH_SECRET=clave_produccion_super_segura_32_chars
AUTH_URL=https://tu-dominio-produccion.com
NEXTAUTH_URL=https://tu-dominio-produccion.com

# Encriptación
ENCRYPTION_KEY=clave_produccion_32_chars_segura

# Google OAuth
GOOGLE_CLIENT_ID=client_id_produccion
GOOGLE_CLIENT_SECRET=client_secret_produccion
```

## 🔍 Validación de Variables

### Script de Verificación
```bash
# Verificar variables críticas
npm run env:check
```

### Validación Manual
```typescript
// Verificar en src/auth.ts
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not set');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}
```

## 🛡️ Seguridad de Variables

### ✅ **Buenas Prácticas**
- Usar archivos `.env.local` para desarrollo
- Nunca commitear archivos `.env` al repositorio
- Rotar claves regularmente en producción
- Usar diferentes claves por entorno
- Validar variables al inicio de la aplicación

### ❌ **Evitar**
- Hardcodear valores en el código
- Usar la misma clave en múltiples entornos
- Compartir claves por canales inseguros
- Dejar variables sin validar

## 🚀 Configuración en Vercel

### Variables de Entorno en Vercel
1. Ir a Project Settings → Environment Variables
2. Añadir cada variable por entorno:
   - **Development**: Para preview deployments
   - **Preview**: Para branches de testing
   - **Production**: Para el branch main

### Ejemplo de Configuración
```
Variable Name: AUTH_SECRET
Value: tu_clave_secreta_32_caracteres
Environment: Production
```

## 🔄 Migración y Actualizaciones

### Actualizar Variables
```bash
# 1. Actualizar .env.local
# 2. Reiniciar servidor de desarrollo
npm run dev

# 3. Para producción, actualizar en Vercel
# 4. Redeploy automático
```

### Rotar Claves de Seguridad
```bash
# Generar nueva AUTH_SECRET
npx auth secret

# Generar nueva ENCRYPTION_KEY (32 chars)
openssl rand -base64 32 | cut -c1-32
```

## 🆘 Troubleshooting

### Errores Comunes

#### "AUTH_SECRET is not set"
```bash
# Solución: Verificar .env.local
echo $AUTH_SECRET
```

#### "Database connection failed"
```bash
# Verificar DATABASE_URL
npx prisma db pull
```

#### "Encryption key invalid"
```bash
# ENCRYPTION_KEY debe ser exactamente 32 caracteres
echo ${#ENCRYPTION_KEY}
```

### Logs de Depuración
```typescript
// Habilitar logs de NextAuth
NEXTAUTH_DEBUG=true
```

## 📚 Referencias

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última actualización**: Enero 2025  
**Versión**: 1.0  
**Estado**: Completo y actualizado