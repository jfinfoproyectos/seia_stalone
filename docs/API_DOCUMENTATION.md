# Documentación de API - SEIA

## Descripción General

La API de SEIA está construida utilizando Next.js 14 App Router con API Routes, proporcionando endpoints RESTful para todas las funcionalidades del sistema. Todos los endpoints están protegidos por autenticación y autorización basada en roles.

## Autenticación

### Esquema de Autenticación
- **Tipo**: JWT (JSON Web Tokens) via NextAuth.js
- **Header**: `Authorization: Bearer <token>`
- **Duración**: 24 horas (configurable)
- **Renovación**: Automática en cada request válido

### Endpoints de Autenticación

#### POST `/api/auth/signin`
Iniciar sesión en el sistema.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "TEACHER",
    "areaId": 2
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/signout`
Cerrar sesión del sistema.

**Response:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## Gestión de Usuarios

### GET `/api/users`
Obtener lista de usuarios (Solo ADMIN).

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `role`: Filtrar por rol (ADMIN, TEACHER)
- `search`: Buscar por nombre o email

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "profesor@ejemplo.com",
      "name": "Profesor Ejemplo",
      "role": "TEACHER",
      "areaId": 2,
      "area": {
        "id": 2,
        "name": "Matemáticas"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST `/api/users`
Crear nuevo usuario (Solo ADMIN).

**Request Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "name": "Nuevo Usuario",
  "password": "contraseña123",
  "role": "TEACHER",
  "areaId": 2
}
```

**Response:**
```json
{
  "user": {
    "id": 15,
    "email": "nuevo@ejemplo.com",
    "name": "Nuevo Usuario",
    "role": "TEACHER",
    "areaId": 2
  },
  "message": "Usuario creado exitosamente"
}
```

### PUT `/api/users/[id]`
Actualizar usuario existente (Solo ADMIN).

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "areaId": 3,
  "role": "TEACHER"
}
```

### DELETE `/api/users/[id]`
Eliminar usuario (Solo ADMIN).

**Response:**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

## Gestión de Áreas Académicas

### GET `/api/areas`
Obtener todas las áreas académicas.

**Response:**
```json
{
  "areas": [
    {
      "id": 1,
      "name": "Matemáticas",
      "description": "Área de ciencias exactas",
      "userCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/areas`
Crear nueva área académica (Solo ADMIN).

**Request Body:**
```json
{
  "name": "Nueva Área",
  "description": "Descripción del área"
}
```

### PUT `/api/areas/[id]`
Actualizar área académica (Solo ADMIN).

### DELETE `/api/areas/[id]`
Eliminar área académica (Solo ADMIN).

## Gestión de Evaluaciones

### GET `/api/evaluations`
Obtener evaluaciones del usuario autenticado.

**Query Parameters:**
- `page`: Número de página
- `limit`: Elementos por página
- `status`: Filtrar por estado (active, inactive)
- `search`: Buscar por título

**Response:**
```json
{
  "evaluations": [
    {
      "id": 1,
      "title": "Examen de Álgebra",
      "description": "Evaluación de conceptos básicos",
      "questions": [
        {
          "id": 1,
          "type": "multiple_choice",
          "question": "¿Cuál es el resultado de 2+2?",
          "options": ["3", "4", "5", "6"],
          "correctAnswer": 1,
          "points": 10
        }
      ],
      "teacherId": 1,
      "teacher": {
        "name": "Profesor Matemáticas"
      },
      "schedules": [
        {
          "id": 1,
          "startTime": "2024-02-01T09:00:00Z",
          "endTime": "2024-02-01T11:00:00Z",
          "uniqueCode": "EXAM2024001",
          "maxAttempts": 1
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/api/evaluations`
Crear nueva evaluación (ADMIN, TEACHER).

**Request Body:**
```json
{
  "title": "Nueva Evaluación",
  "description": "Descripción de la evaluación",
  "helpUrl": "https://ejemplo.com/ayuda",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Pregunta de ejemplo",
      "options": ["Opción 1", "Opción 2", "Opción 3"],
      "correctAnswer": 0,
      "points": 10
    }
  ]
}
```

### PUT `/api/evaluations/[id]`
Actualizar evaluación existente.

### DELETE `/api/evaluations/[id]`
Eliminar evaluación.

## Gestión de Horarios

### GET `/api/schedules`
Obtener horarios de evaluaciones.

**Response:**
```json
{
  "schedules": [
    {
      "id": 1,
      "evaluationId": 1,
      "evaluation": {
        "title": "Examen de Álgebra"
      },
      "startTime": "2024-02-01T09:00:00Z",
      "endTime": "2024-02-01T11:00:00Z",
      "uniqueCode": "EXAM2024001",
      "maxAttempts": 1,
      "attemptCount": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/api/schedules`
Crear nuevo horario de evaluación.

**Request Body:**
```json
{
  "evaluationId": 1,
  "startTime": "2024-02-01T09:00:00Z",
  "endTime": "2024-02-01T11:00:00Z",
  "maxAttempts": 1
}
```

### PUT `/api/schedules/[id]`
Actualizar horario existente.

### DELETE `/api/schedules/[id]`
Eliminar horario.

## Gestión de Intentos

### GET `/api/attempts`
Obtener intentos de evaluación.

**Query Parameters:**
- `scheduleId`: Filtrar por horario específico
- `studentEmail`: Filtrar por email de estudiante
- `page`: Número de página
- `limit`: Elementos por página

**Response:**
```json
{
  "attempts": [
    {
      "id": 1,
      "scheduleId": 1,
      "schedule": {
        "evaluation": {
          "title": "Examen de Álgebra"
        }
      },
      "studentName": "Juan Pérez",
      "studentEmail": "juan@estudiante.com",
      "uniqueCode": "EXAM2024001",
      "answers": [
        {
          "questionId": 1,
          "answer": 1,
          "isCorrect": true,
          "points": 10
        }
      ],
      "startTime": "2024-02-01T09:15:00Z",
      "endTime": "2024-02-01T10:45:00Z",
      "score": 85,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-02-01T09:15:00Z"
    }
  ]
}
```

### POST `/api/attempts`
Crear nuevo intento de evaluación (Estudiantes).

**Request Body:**
```json
{
  "uniqueCode": "EXAM2024001",
  "studentName": "Juan Pérez",
  "studentEmail": "juan@estudiante.com"
}
```

### PUT `/api/attempts/[id]`
Actualizar intento (enviar respuestas).

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "answer": 1
    },
    {
      "questionId": 2,
      "answer": "Respuesta abierta"
    }
  ]
}
```

### POST `/api/attempts/[id]/finish`
Finalizar intento de evaluación.

## Monitoreo en Tiempo Real

### GET `/api/live/students`
Obtener estudiantes activos en tiempo real.

**Response:**
```json
{
  "activeStudents": [
    {
      "id": 1,
      "studentName": "Juan Pérez",
      "studentEmail": "juan@estudiante.com",
      "evaluation": "Examen de Álgebra",
      "startTime": "2024-02-01T09:15:00Z",
      "timeElapsed": 1800,
      "progress": 75,
      "ipAddress": "192.168.1.100",
      "status": "in_progress"
    }
  ],
  "summary": {
    "totalActive": 15,
    "totalCompleted": 8,
    "averageProgress": 65
  }
}
```

### GET `/api/live/evaluations`
Obtener estado de evaluaciones activas.

**Response:**
```json
{
  "activeEvaluations": [
    {
      "id": 1,
      "title": "Examen de Álgebra",
      "startTime": "2024-02-01T09:00:00Z",
      "endTime": "2024-02-01T11:00:00Z",
      "activeStudents": 15,
      "completedAttempts": 8,
      "averageScore": 78.5,
      "status": "active"
    }
  ]
}
```

## Herramientas Pedagógicas

### POST `/api/tools/github-forks`
Analizar forks de repositorio GitHub.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/usuario/repositorio"
}
```

### POST `/api/tools/rubric-generator`
Generar rúbrica de evaluación.

**Request Body:**
```json
{
  "topic": "Programación en JavaScript",
  "criteria": ["Sintaxis", "Lógica", "Buenas prácticas"],
  "levels": 4
}
```

### POST `/api/tools/checklist-generator`
Generar checklist de evaluación.

### POST `/api/tools/audio-analyzer`
Analizar archivo de audio.

### POST `/api/getWebPage`
Obtener contenido de página web.

**Request Body:**
```json
{
  "url": "https://ejemplo.com"
}
```

## Reportes y Estadísticas

### GET `/api/reports/summary`
Obtener resumen estadístico.

**Response:**
```json
{
  "summary": {
    "totalUsers": 50,
    "totalEvaluations": 25,
    "totalAttempts": 1250,
    "averageScore": 78.5,
    "activeEvaluations": 3
  },
  "recentActivity": [
    {
      "type": "evaluation_created",
      "description": "Nueva evaluación: Examen Final",
      "timestamp": "2024-02-01T10:30:00Z"
    }
  ]
}
```

### GET `/api/reports/evaluations/[id]/stats`
Obtener estadísticas de evaluación específica.

## Códigos de Estado HTTP

### Éxito
- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido

### Errores del Cliente
- `400 Bad Request`: Datos de entrada inválidos
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos suficientes
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto de datos (ej: email duplicado)
- `422 Unprocessable Entity`: Error de validación

### Errores del Servidor
- `500 Internal Server Error`: Error interno del servidor
- `503 Service Unavailable`: Servicio temporalmente no disponible

## Formato de Errores

Todos los errores siguen el siguiente formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": [
      {
        "field": "email",
        "message": "El email debe tener un formato válido"
      }
    ],
    "timestamp": "2024-02-01T10:30:00Z"
  }
}
```

## Rate Limiting

- **Límite general**: 100 requests por minuto por IP
- **Autenticación**: 5 intentos por minuto por IP
- **Herramientas**: 10 requests por minuto por usuario
- **Headers de respuesta**:
  - `X-RateLimit-Limit`: Límite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## Versionado

- **Versión actual**: v1
- **URL base**: `/api/v1/` (futuro)
- **Compatibilidad**: Mantenida por 12 meses
- **Deprecación**: Notificación 6 meses antes

## Ejemplos de Uso

### Crear y Programar Evaluación

```javascript
// 1. Crear evaluación
const evaluation = await fetch('/api/evaluations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Examen Final',
    questions: [/* preguntas */]
  })
});

// 2. Programar horario
const schedule = await fetch('/api/schedules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    evaluationId: evaluation.id,
    startTime: '2024-02-01T09:00:00Z',
    endTime: '2024-02-01T11:00:00Z'
  })
});
```

### Monitoreo en Tiempo Real

```javascript
// Polling cada 5 segundos
setInterval(async () => {
  const response = await fetch('/api/live/students', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  updateUI(data.activeStudents);
}, 5000);
```

---

**Última actualización**: Enero 2025  
**Versión de API**: 1.0  
**Estado**: Estable y documentada