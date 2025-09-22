# Configuración de Base de Datos

## Descripción General
Este documento describe la configuración de la base de datos PostgreSQL para el sistema SEIA, incluyendo la estructura de tablas, relaciones y configuración con Prisma ORM.

## Stack de Base de Datos
- **PostgreSQL**: Base de datos principal (14+)
- **Prisma ORM**: Gestión de esquema y migraciones
- **Conexiones SSL**: Seguridad en producción
- **Backup automático**: Respaldo de datos críticos

## Configuración con Prisma

### 1. Estructura del Proyecto
```
prisma/
├── schema.prisma          # Esquema principal de la base de datos
├── seed.ts               # Datos iniciales del sistema
└── migrations/           # Historial de migraciones
```

### 2. Configuración de Conexión
```bash
# Variable de entorno requerida
DATABASE_URL="postgresql://usuario:password@host:puerto/database?sslmode=require"
```

### 3. Comandos Principales
```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Poblar base de datos inicial
npm run db:seed

# Visualizar base de datos
npx prisma studio
```

## Esquema de Base de Datos Actual

### Entidades Principales

#### 👥 Gestión de Usuarios
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(TEACHER)
  areaId    Int?
  area      Area?    @relation(fields: [areaId], references: [id])
  apiKey    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  TEACHER
}
```

#### 🏫 Áreas Académicas
```prisma
model Area {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 📝 Evaluaciones
```prisma
model Evaluation {
  id          Int        @id @default(autoincrement())
  title       String
  description String?
  helpUrl     String?
  questions   Json
  teacherId   Int
  teacher     User       @relation(fields: [teacherId], references: [id])
  schedules   Schedule[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

#### ⏰ Programación de Horarios
```prisma
model Schedule {
  id           Int       @id @default(autoincrement())
  evaluationId Int
  evaluation   Evaluation @relation(fields: [evaluationId], references: [id])
  startTime    DateTime
  endTime      DateTime
  uniqueCode   String    @unique
  maxAttempts  Int       @default(1)
  attempts     Attempt[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

#### 🎯 Intentos de Evaluación
```prisma
model Attempt {
  id           Int      @id @default(autoincrement())
  scheduleId   Int
  schedule     Schedule @relation(fields: [scheduleId], references: [id])
  studentName  String
  studentEmail String
  uniqueCode   String
  answers      Json?
  startTime    DateTime @default(now())
  endTime      DateTime?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Configuración de Desarrollo

### 1. Configuración Local
```bash
# Clonar repositorio
git clone [url-repositorio]
cd admin

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 2. Base de Datos Local
```bash
# Opción 1: PostgreSQL local
DATABASE_URL="postgresql://usuario:password@localhost:5432/seia_dev"

# Opción 2: Supabase (recomendado)
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require"
```

### 3. Inicialización
```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Poblar datos iniciales
npm run db:seed

# Verificar configuración
npx prisma studio
```

## Datos Iniciales del Sistema

### Usuario Administrador Predeterminado
```typescript
{
  email: "admin@seia.edu",
  password: "admin123", // Cambiar en producción
  name: "Administrador del Sistema",
  role: "ADMIN"
}
```

### Áreas Académicas Iniciales
- **Matemáticas**: Álgebra, Cálculo, Estadística
- **Ciencias**: Física, Química, Biología
- **Tecnología**: Programación, Sistemas, Redes
- **Humanidades**: Literatura, Historia, Filosofía
- **Idiomas**: Inglés, Francés, Alemán

### Configuraciones del Sistema
- Límites de intentos por defecto
- Configuraciones de seguridad
- Plantillas de evaluación básicas

## Migraciones y Versionado

### Gestión de Migraciones
```bash
# Crear nueva migración
npx prisma migrate dev --name descripcion_cambio

# Ver estado de migraciones
npx prisma migrate status

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Resetear base de datos (desarrollo)
npx prisma migrate reset
```

### Historial de Cambios
- **v1.0**: Esquema inicial con usuarios y evaluaciones
- **v1.1**: Agregado sistema de áreas académicas
- **v1.2**: Implementación de horarios y códigos únicos
- **v1.3**: Sistema de intentos y respuestas
- **v1.4**: Campos de auditoría y seguridad

## Configuración de Producción

### Variables de Entorno Requeridas
```bash
DATABASE_URL="postgresql://[user]:[pass]@[host]:5432/[db]?sslmode=require"
AUTH_SECRET="clave_secreta_super_segura"
NEXTAUTH_URL="https://tu-dominio.com"
ENCRYPTION_KEY="clave_de_encriptacion"
```

### Optimizaciones de Producción
- **Conexiones SSL**: Obligatorias en producción
- **Pool de conexiones**: Configurado automáticamente por Prisma
- **Índices de base de datos**: Optimizados para consultas frecuentes
- **Backup automático**: Configurado en el proveedor de base de datos

## Mantenimiento y Monitoreo

### Tareas de Mantenimiento
```bash
# Verificar integridad de datos
npx prisma validate

# Optimizar base de datos
npx prisma db push --accept-data-loss

# Generar reporte de uso
npx prisma studio
```

### Métricas Importantes
- **Número de usuarios activos**
- **Evaluaciones creadas por mes**
- **Intentos de evaluación por día**
- **Tiempo promedio de respuesta de consultas**

### Backup y Recuperación
- **Backup diario**: Automático en Supabase/Railway
- **Retención**: 30 días de backups
- **Recuperación**: Proceso documentado para emergencias
- **Testing**: Pruebas mensuales de recuperación

## Solución de Problemas Comunes

### Error de Conexión
```bash
# Verificar conectividad
npx prisma db pull

# Probar conexión
npx prisma studio
```

### Problemas de Migraciones
```bash
# Ver estado detallado
npx prisma migrate status

# Resolver conflictos
npx prisma migrate resolve --applied [migration_name]
```

### Rendimiento Lento
- Verificar índices de base de datos
- Analizar consultas lentas
- Optimizar queries complejas
- Considerar cache de consultas

---

**Última actualización**: Enero 2025  
**Estado**: Esquema estable, optimizado para producción