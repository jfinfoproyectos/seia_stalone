# Interfaz de Estudiantes - SEIA

## 🎯 Descripción General

La interfaz de estudiantes de SEIA está diseñada con múltiples capas de seguridad y una experiencia de usuario optimizada para evaluaciones académicas. Utiliza un directorio ofuscado para mayor seguridad.

## 🔐 Directorio Ofuscado

### Estructura de Seguridad
```
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/
```
- **Propósito**: Ocultar rutas de acceso directo
- **Beneficio**: Previene acceso no autorizado
- **Método**: Hash hexadecimal de 40 caracteres

### Rutas Disponibles
```
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/           # Página principal
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/evaluation/ # Interfaz de evaluación
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/success/    # Página de éxito
/a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/report/     # Reporte de resultados
```

## 🏗️ Arquitectura de Componentes

### Estructura de Directorios
```
a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0/
├── components/              # Componentes reutilizables
│   ├── EvaluationTimer.tsx     # Temporizador de evaluación
│   ├── ProgressIndicator.tsx   # Indicador de progreso
│   └── QuestionNavigator.tsx   # Navegación entre preguntas
├── evaluation/              # Módulo de evaluación
│   ├── actions.ts              # Server actions
│   ├── components/             # Componentes específicos
│   │   ├── code-editor.tsx     # Editor de código Monaco
│   │   └── markdown-viewer.tsx # Visor de markdown
│   ├── hooks/                  # Hooks especializados
│   │   ├── useMarkdownConfig.ts
│   │   └── useMonacoConfig.ts
│   └── page.tsx               # Página principal de evaluación
├── hooks/                   # Hooks globales
│   ├── useEvaluationTimer.ts   # Gestión de tiempo
│   ├── usePageVisibility.ts    # Detección de cambios de pestaña
│   ├── useQuestionNavigation.ts # Navegación de preguntas
│   ├── useStudentData.ts       # Datos del estudiante
│   └── useThemeManagement.ts   # Gestión de temas
├── page.tsx                 # Página de acceso
├── report/                  # Módulo de reportes
└── success/                 # Página de confirmación
```

## 🎮 Hooks Personalizados

### useEvaluationTimer
```typescript
// Gestión completa del tiempo de evaluación
const {
  timeRemaining,
  isTimeExpired,
  progressPercentage,
  startTimer,
  pauseTimer
} = useEvaluationTimer(startTime, endTime);
```

**Características:**
- Cuenta regresiva en tiempo real
- Detección automática de expiración
- Cálculo de porcentaje de progreso
- Persistencia entre recargas

### usePageVisibility
```typescript
// Detección de cambios de pestaña (anti-fraude)
const {
  isVisible,
  visibilityChanges,
  timeOutOfFocus
} = usePageVisibility();
```

**Características:**
- Detecta cuando el estudiante cambia de pestaña
- Cuenta tiempo fuera de la evaluación
- Registra número de cambios de visibilidad
- Alertas automáticas por comportamiento sospechoso

### useStudentData
```typescript
// Gestión de datos del estudiante
const {
  email,
  firstName,
  lastName,
  isDataLoaded,
  updateStudentData
} = useStudentData();
```

**Características:**
- Persistencia en localStorage
- Validación de datos requeridos
- Sincronización con servidor
- Manejo de estados de carga

### useQuestionNavigation
```typescript
// Navegación inteligente entre preguntas
const {
  currentQuestionIndex,
  goToQuestion,
  nextQuestion,
  previousQuestion,
  canGoNext,
  canGoPrevious
} = useQuestionNavigation(questions, answers);
```

**Características:**
- Navegación secuencial y directa
- Validación de respuestas requeridas
- Indicadores de progreso
- Prevención de saltos no permitidos

### useThemeManagement
```typescript
// Gestión de temas y apariencia
const {
  theme,
  setTheme,
  systemTheme,
  resolvedTheme
} = useThemeManagement();
```

**Características:**
- Soporte para tema claro/oscuro
- Detección automática del tema del sistema
- Persistencia de preferencias
- Transiciones suaves

## 🎨 Componentes Principales

### EvaluationTimer
```typescript
interface EvaluationTimerProps {
  timeRemaining: number;
  isTimeExpired: boolean;
  progressPercentage: number;
  variant: 'default' | 'compact';
  showProgressBar: boolean;
}
```

**Características:**
- Múltiples variantes de visualización
- Alertas visuales por tiempo restante
- Barra de progreso animada
- Responsive design

### QuestionNavigator
```typescript
interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  onQuestionSelect: (index: number) => void;
}
```

**Características:**
- Vista de miniatura de todas las preguntas
- Indicadores de estado (respondida/pendiente)
- Navegación rápida por clic
- Validación antes de cambio

### ProgressIndicator
```typescript
interface ProgressIndicatorProps {
  total: number;
  completed: number;
  showPercentage: boolean;
  variant: 'linear' | 'circular';
}
```

**Características:**
- Múltiples estilos de visualización
- Animaciones fluidas
- Información detallada de progreso
- Accesibilidad completa

## 💻 Editor de Código

### Monaco Editor Integration
```typescript
// components/code-editor.tsx
- Sintaxis highlighting para múltiples lenguajes
- Autocompletado inteligente
- Temas personalizados (claro/oscuro)
- Validación en tiempo real
- Shortcuts de teclado
```

**Lenguajes Soportados:**
- JavaScript/TypeScript
- Python
- Java
- C/C++
- HTML/CSS
- SQL
- Y más...

**Características:**
- IntelliSense activado
- Detección de errores
- Formateo automático
- Plegado de código
- Búsqueda y reemplazo

## 📝 Visor de Markdown

### Markdown Viewer
```typescript
// components/markdown-viewer.tsx
- Renderizado de markdown enriquecido
- Soporte para código embebido
- Imágenes y enlaces
- Tablas y listas
- Matemáticas (LaTeX)
```

**Características:**
- Sanitización de HTML
- Syntax highlighting en bloques de código
- Responsive design
- Temas personalizables
- Accesibilidad completa

## 🔄 Flujo de Evaluación

### 1. **Acceso Inicial**
```typescript
// page.tsx - Página principal
1. Estudiante ingresa código único
2. Validación de código y horario
3. Captura de datos del estudiante
4. Redirección a evaluación
```

### 2. **Durante la Evaluación**
```typescript
// evaluation/page.tsx
1. Carga de preguntas y configuración
2. Inicialización de temporizadores
3. Monitoreo de actividad
4. Guardado automático de respuestas
5. Validación continua
```

### 3. **Finalización**
```typescript
// Proceso de envío
1. Validación final de respuestas
2. Cálculo de puntuaciones
3. Envío al servidor
4. Confirmación y redirección
```

## 🛡️ Medidas de Seguridad

### Anti-Fraude
- **Detección de cambios de pestaña**
- **Monitoreo de tiempo fuera de foco**
- **Validación de dispositivo único**
- **Timestamps de todas las acciones**
- **Prevención de copiar/pegar** (configurable)

### Validación de Datos
- **Sanitización de entrada**
- **Validación de tipos**
- **Límites de longitud**
- **Caracteres permitidos**

### Persistencia Segura
- **Encriptación de datos locales**
- **Sincronización con servidor**
- **Recuperación ante fallos**
- **Backup automático**

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablets pequeñas */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Pantallas grandes */
```

### Adaptaciones por Dispositivo
- **Móvil**: Interfaz simplificada, navegación por gestos
- **Tablet**: Layout híbrido, teclado virtual optimizado
- **Desktop**: Interfaz completa, shortcuts de teclado

## 🎯 Experiencia de Usuario

### Características UX
- **Carga progresiva** de contenido
- **Feedback visual** inmediato
- **Navegación intuitiva**
- **Accesibilidad completa** (WCAG 2.1)
- **Soporte offline** limitado

### Optimizaciones de Performance
- **Lazy loading** de componentes
- **Memoización** de cálculos pesados
- **Debouncing** de entrada de usuario
- **Compresión** de datos

## 🔧 Configuración y Personalización

### Variables de Configuración
```typescript
// Configurables por evaluación
- Tiempo límite
- Tipos de pregunta permitidos
- Navegación libre vs secuencial
- Ayuda externa habilitada
- Modo oscuro forzado
```

### Personalización de Tema
```typescript
// Temas disponibles
- Light (por defecto)
- Dark
- High Contrast
- Sistema (automático)
```

---

**Última actualización**: Enero 2025  
**Versión**: 1.0  
**Estado**: Implementado y funcional