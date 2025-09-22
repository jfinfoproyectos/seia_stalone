# Sistema de Monitoreo en Tiempo Real

## Descripción General
El sistema de monitoreo en tiempo real de SEIA permite a los profesores supervisar el progreso de los estudiantes durante las evaluaciones activas, proporcionando visibilidad completa del estado de cada participante y detectando comportamientos anómalos.

## 🔍 Características Principales

### Panel de Monitoreo en Vivo
**Ubicación**: `/teacher/live-panel`

#### Funcionalidades Clave
- **Vista en tiempo real** de estudiantes conectados
- **Progreso por pregunta** de cada estudiante
- **Detección de anomalías** en comportamiento
- **Métricas de sesión** instantáneas
- **Alertas automáticas** de eventos importantes

### Datos Monitoreados

#### 👥 Información de Estudiantes
- **Estado de conexión**: Online/Offline en tiempo real
- **Tiempo de sesión**: Duración total conectado
- **Progreso actual**: Pregunta actual y completadas
- **Tiempo por pregunta**: Análisis de velocidad de respuesta
- **Última actividad**: Timestamp de última acción

#### 📊 Métricas de Evaluación
- **Estudiantes activos**: Conteo en tiempo real
- **Promedio de progreso**: Porcentaje general completado
- **Tiempo promedio**: Tiempo medio por pregunta
- **Tasa de finalización**: Estudiantes que han terminado
- **Detecciones de fraude**: Alertas de comportamiento sospechoso

## 🛠️ Implementación Técnica

### Arquitectura del Sistema

#### Hooks de Datos en Vivo
```typescript
// Hook principal para datos en tiempo real
export function useAllLiveData(options: UseLiveDataOptions = {}) {
  const evaluationsData = useLiveEvaluations(options);
  const studentsData = useLiveStudents(undefined, options);
  
  return {
    evaluations: evaluationsData.data,
    students: studentsData.data,
    isLoading: evaluationsData.isLoading || studentsData.isLoading,
    error: evaluationsData.error || studentsData.error,
    refresh: () => {
      evaluationsData.refresh();
      studentsData.refresh();
    }
  };
}
```

#### Actualización Automática
- **Polling inteligente**: Actualización cada 5-30 segundos según actividad
- **Optimización de recursos**: Reducción de frecuencia cuando no hay cambios
- **Manejo de errores**: Recuperación automática de conexiones perdidas
- **Cache local**: Almacenamiento temporal para mejor rendimiento

### Componentes del Sistema

#### 📋 Tabla de Estudiantes en Vivo
**Archivo**: `LiveStudentsTable.tsx`

##### Características
- **Lista dinámica** de estudiantes conectados
- **Indicadores visuales** de estado (online/offline)
- **Progreso visual** con barras de progreso
- **Tiempo transcurrido** por estudiante
- **Acciones rápidas** (ver detalles, enviar mensaje)

##### Información Mostrada
```typescript
interface LiveStudentData {
  id: number;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'suspicious';
  currentQuestion: number;
  totalQuestions: number;
  timeSpent: number;
  lastActivity: Date;
  suspiciousActivity: boolean;
}
```

#### 📈 Panel de Evaluaciones Activas
**Archivo**: `LiveEvaluationsPanel.tsx`

##### Funcionalidades
- **Lista de evaluaciones activas** en tiempo real
- **Métricas por evaluación** (participantes, progreso)
- **Control de sesiones** (pausar, finalizar)
- **Exportación de datos** en vivo
- **Configuración de alertas** personalizadas

### 🚨 Sistema de Alertas

#### Tipos de Alertas
1. **Comportamiento Sospechoso**
   - Cambios frecuentes de pestaña
   - Tiempo anormalmente rápido en preguntas
   - Patrones de respuesta irregulares

2. **Problemas Técnicos**
   - Desconexiones frecuentes
   - Errores de conectividad
   - Problemas de rendimiento

3. **Eventos de Evaluación**
   - Estudiante finaliza evaluación
   - Tiempo límite próximo a vencer
   - Nuevos estudiantes se conectan

#### Configuración de Alertas
```typescript
interface AlertConfig {
  suspiciousActivity: boolean;
  technicalIssues: boolean;
  evaluationEvents: boolean;
  customThresholds: {
    maxTabSwitches: number;
    minTimePerQuestion: number;
    maxDisconnections: number;
  };
}
```

## 📱 Interfaz de Usuario

### Dashboard Principal
- **Resumen ejecutivo** con métricas clave
- **Gráficos en tiempo real** de actividad
- **Lista de evaluaciones activas**
- **Alertas recientes** y notificaciones

### Vista Detallada por Estudiante
- **Perfil del estudiante** con foto y datos
- **Historial de actividad** detallado
- **Progreso por pregunta** con tiempos
- **Gráficos de comportamiento** temporal
- **Acciones disponibles** (contactar, supervisar)

### Controles de Profesor
- **Pausar/Reanudar evaluaciones**
- **Enviar mensajes** a estudiantes específicos
- **Exportar datos** de sesión actual
- **Configurar alertas** personalizadas
- **Generar reportes** instantáneos

## 🔧 Configuración y Personalización

### Configuración de Monitoreo
```typescript
interface LiveMonitoringConfig {
  refreshInterval: number;        // Intervalo de actualización (ms)
  alertThresholds: AlertConfig;   // Configuración de alertas
  displayOptions: {
    showOfflineStudents: boolean;
    groupByEvaluation: boolean;
    sortBy: 'name' | 'progress' | 'time';
  };
  autoRefresh: boolean;          // Actualización automática
}
```

### Personalización por Profesor
- **Preferencias de vista**: Layout y organización de datos
- **Configuración de alertas**: Umbrales personalizados
- **Filtros predeterminados**: Configuración de filtros favoritos
- **Exportación automática**: Programación de reportes

## 📊 Métricas y Analytics

### Métricas en Tiempo Real
- **Estudiantes conectados**: Conteo actual
- **Tasa de progreso**: Velocidad promedio de avance
- **Tiempo promedio por pregunta**: Análisis de dificultad
- **Detecciones de fraude**: Conteo de alertas de seguridad
- **Rendimiento del sistema**: Latencia y disponibilidad

### Análisis de Comportamiento
- **Patrones de navegación**: Cómo se mueven entre preguntas
- **Tiempo de reflexión**: Análisis de pausas y pensamiento
- **Consistencia de respuestas**: Detección de patrones anómalos
- **Actividad por horario**: Distribución temporal de actividad

## 🔒 Seguridad y Privacidad

### Protección de Datos
- **Encriptación en tránsito**: Todas las comunicaciones cifradas
- **Acceso controlado**: Solo profesores autorizados
- **Anonimización**: Opciones para ocultar identidades
- **Retención limitada**: Datos eliminados después del período configurado

### Cumplimiento de Privacidad
- **Consentimiento informado**: Estudiantes informados del monitoreo
- **Transparencia**: Políticas claras sobre qué se monitorea
- **Derechos del estudiante**: Acceso a sus propios datos
- **Auditoría**: Registro de accesos a datos sensibles

## 🚀 Casos de Uso

### Evaluaciones Presenciales
- **Supervisión remota**: Monitoreo desde cualquier ubicación
- **Detección temprana**: Identificación rápida de problemas
- **Asistencia técnica**: Soporte inmediato a estudiantes
- **Control de integridad**: Prevención de fraude en tiempo real

### Evaluaciones a Distancia
- **Supervisión virtual**: Equivalente a supervisión presencial
- **Verificación de identidad**: Confirmación de participantes
- **Monitoreo de ambiente**: Detección de ayuda externa
- **Soporte técnico**: Asistencia remota inmediata

### Evaluaciones Masivas
- **Escalabilidad**: Monitoreo de cientos de estudiantes
- **Automatización**: Alertas automáticas para eventos clave
- **Distribución de carga**: Múltiples supervisores
- **Reportes agregados**: Métricas a nivel institucional

## 🔮 Desarrollo Futuro

### Próximas Características
- **IA predictiva**: Predicción de comportamientos problemáticos
- **Integración con cámaras**: Monitoreo visual automático
- **Análisis de audio**: Detección de conversaciones
- **Biometría**: Verificación continua de identidad

### Mejoras Planificadas
- **Rendimiento**: Optimización para evaluaciones masivas
- **Móvil**: Aplicación móvil para supervisión
- **Integración**: Conexión con sistemas de videoconferencia
- **Analytics avanzados**: Machine learning para detección de patrones

---

**Última actualización**: Enero 2025  
**Estado**: Sistema completamente funcional, mejoras continuas en desarrollo