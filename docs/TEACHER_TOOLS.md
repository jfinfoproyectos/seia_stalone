# Herramientas Pedagógicas para Profesores

## Descripción General
SEIA incluye herramientas pedagógicas básicas diseñadas para facilitar tareas comunes de los profesores. Las herramientas están en desarrollo continuo y ofrecen funcionalidades esenciales.

## 🛠️ Herramientas Disponibles

### 1. 🔗 Evaluador de Repositorios GitHub
**Ubicación**: `/teacher/tools/github-forks`

#### Funcionalidades Implementadas
- **Búsqueda de forks**: Obtención de forks de repositorios educativos
- **Integración con IA**: Uso de Google Gemini para análisis básico de código
- **Filtrado por grupo**: Organización de estudiantes por grupos
- **Evaluación individual**: Análisis de repositorios uno por uno
- **Exportación a Excel**: Generación de archivos Excel con calificaciones
- **Generación de PDFs**: Reportes individuales de evaluación

#### Características Técnicas
- Requiere token de GitHub personal
- Integración con GitHub API
- Análisis básico de estructura de código
- Persistencia de evaluaciones en el repositorio

#### Casos de Uso
- Evaluación de proyectos de programación
- Análisis de tareas de desarrollo
- Generación de reportes de calificaciones

### 2. 📝 Notas Rápidas
**Ubicación**: `/teacher/tools/quick-notes`

#### Funcionalidades Implementadas
- **Toma de notas rápida**: Sistema simple de notas apiladas
- **Generación con IA**: Conversión de notas a diferentes formatos usando Gemini
- **Múltiples formatos de salida**: Resumen, correo, puntos clave, informe, etc.
- **Gestión de favoritos**: Guardar resultados importantes
- **Exportación/Importación**: Backup de proyectos en JSON
- **Copia al portapapeles**: Funcionalidad de copia rápida

#### Características
- Interfaz simple y directa
- Integración con Google Gemini
- Almacenamiento local
- Múltiples opciones de formato

### 3. 📋 Generador de Rúbricas (Básico)
**Ubicación**: `/teacher/tools/rubric-generator`

#### Estado: Página básica implementada
- Interfaz de usuario creada
- Funcionalidades avanzadas en desarrollo

### 4. 🎵 Analizador de Audio (Básico)
**Ubicación**: `/teacher/tools/audio-analyzer`

#### Estado: Página básica implementada
- Interfaz de usuario creada
- Funcionalidades de análisis en desarrollo

### 5. 🎙️ Generador de Podcasts (Básico)
**Ubicación**: `/teacher/tools/podcast-generator`

#### Estado: Página básica implementada
- Interfaz de usuario creada
- Funcionalidades de generación en desarrollo

### 6. 🌐 Traductor (Básico)
**Ubicación**: `/teacher/tools/translator`

#### Estado: Página básica implementada
- Interfaz de usuario creada
- Funcionalidades de traducción en desarrollo

### 7. ✅ Generador de Checklists (Básico)
**Ubicación**: `/teacher/tools/checklist-generator`

#### Estado: Página básica implementada
- Interfaz de usuario creada
- Funcionalidades avanzadas en desarrollo

## 🔧 Configuración y Uso

### Requisitos Técnicos
- **Google Gemini API**: Clave requerida para funcionalidades de IA
- **GitHub Token**: Token personal para el evaluador de repositorios
- **Navegador moderno**: Compatible con JavaScript ES6+

### Configuración de API Keys
```bash
# Variable de entorno principal
GOOGLE_GEMINI_API_KEY=tu_clave_gemini
```

### Acceso a Herramientas
1. **Navegación**: Acceso desde `/teacher/tools`
2. **Autenticación**: Requiere rol de profesor
3. **Configuración individual**: Cada herramienta maneja su propia configuración
4. **Almacenamiento local**: Datos guardados en el navegador

## 📊 Estado de Implementación

### Herramientas Completamente Funcionales
- **Evaluador de Repositorios GitHub**: Funcionalidad completa
- **Notas Rápidas**: Funcionalidad completa

### Herramientas en Desarrollo
- **Generador de Rúbricas**: Interfaz básica, funcionalidades en desarrollo
- **Analizador de Audio**: Interfaz básica, funcionalidades en desarrollo
- **Generador de Podcasts**: Interfaz básica, funcionalidades en desarrollo
- **Traductor**: Interfaz básica, funcionalidades en desarrollo
- **Generador de Checklists**: Interfaz básica, funcionalidades en desarrollo

## 🚀 Uso Actual

### Evaluador de Repositorios GitHub
1. Configurar token de GitHub personal
2. Ingresar URL del repositorio original
3. Buscar y filtrar forks de estudiantes
4. Evaluar repositorios individualmente
5. Exportar resultados a Excel o PDF

### Notas Rápidas
1. Escribir notas rápidas presionando Enter
2. Seleccionar formato de salida deseado
3. Generar contenido con IA
4. Gestionar favoritos y exportar proyectos

## 🔮 Desarrollo Futuro

### Próximas Mejoras
- **Completar herramientas básicas**: Finalizar funcionalidades pendientes
- **Integración mejorada**: Conexión entre herramientas
- **Persistencia en base de datos**: Almacenamiento permanente de datos
- **Interfaz mejorada**: UX más intuitiva

### Limitaciones Actuales
- **Almacenamiento local**: Datos no persisten entre dispositivos
- **Funcionalidades limitadas**: Muchas herramientas en desarrollo inicial
- **Sin integración**: Herramientas funcionan de forma independiente

---

**Última actualización**: Enero 2025  
**Estado**: Desarrollo inicial, funcionalidades básicas implementadas