# Panel en Vivo - Monitoreo de Evaluaciones en Tiempo Real

Este módulo proporciona un panel de control en tiempo real para que los profesores puedan monitorear las evaluaciones de estudiantes mientras están en progreso.

## Características

### 🔄 Actualización en Tiempo Real
- Datos actualizados automáticamente cada 5 segundos (configurable)
- Pausa automática cuando la pestaña no está visible para optimizar recursos
- Actualización manual disponible

### 📊 Estadísticas en Vivo
- **Evaluaciones Activas**: Número de evaluaciones en curso
- **Estudiantes Activos**: Estudiantes que están tomando evaluaciones
- **Envíos del Día**: Total de evaluaciones enviadas hoy

### 📋 Panel de Evaluaciones
- Lista de evaluaciones activas con:
  - Tiempo restante
  - Porcentaje de progreso
  - Número de estudiantes activos/enviados
  - Estado de la evaluación

### 👥 Tabla de Estudiantes
- Monitoreo individual de estudiantes con:
  - Estado (Activo, Enviado, Inactivo)
  - Progreso de la evaluación
  - Tiempo fuera de la evaluación
  - Última actividad
  - Filtros por estado

### 🔔 Notificaciones
- Alertas en tiempo real para:
  - Nuevos estudiantes que inician evaluaciones
  - Evaluaciones enviadas
  - Advertencias (tiempo excesivo fuera de evaluación)
  - Información del sistema

### ⚙️ Configuración
- Intervalo de actualización personalizable (1s - 1min)
- Activar/desactivar actualización automática
- Control de notificaciones
- Configuraciones rápidas predefinidas

## Estructura de Archivos

```
live-panel/
├── components/
│   ├── LiveStatsCards.tsx          # Tarjetas de estadísticas
│   ├── LiveEvaluationsPanel.tsx    # Panel de evaluaciones activas
│   ├── LiveStudentsTable.tsx       # Tabla de estudiantes
│   ├── LivePanelSettings.tsx       # Configuración del panel
│   ├── LiveNotifications.tsx       # Sistema de notificaciones
│   └── index.ts                    # Exportaciones
├── hooks/
│   └── useLiveData.ts              # Hooks para datos en tiempo real
├── actions.ts                      # Server Actions
├── page.tsx                        # Página principal
└── README.md                       # Documentación
```

## Server Actions

### `getLiveEvaluations()`
Obtiene todas las evaluaciones activas con datos de estudiantes.

### `getLiveStudents(evaluationId: string)`
Obtiene estudiantes activos para una evaluación específica.

### `getAllLiveStudents()`
Obtiene todos los estudiantes activos en todas las evaluaciones.

### `getLiveStats()`
Obtiene estadísticas generales del día.

## Hooks Personalizados

### `useLiveEvaluations(interval, enabled)`
Hook para obtener evaluaciones en tiempo real.

### `useLiveStudents(evaluationId, interval, enabled)`
Hook para obtener estudiantes de una evaluación específica.

### `useLiveStats(interval, enabled)`
Hook para obtener estadísticas en tiempo real.

### `useAllLiveData(interval, enabled)`
Hook combinado que obtiene todos los datos necesarios.

## Uso

1. **Acceso**: Navegar a `/teacher/live-panel`
2. **Navegación**: Usar las pestañas para alternar entre vistas
3. **Configuración**: Usar el botón de configuración para ajustar intervalos
4. **Notificaciones**: Activar/desactivar desde configuración
5. **Actualización**: Manual con el botón "Actualizar" o automática

## Optimizaciones

- **Visibilidad**: El polling se pausa cuando la pestaña no está visible
- **Memoria**: Las notificaciones se limitan a 10 elementos
- **Red**: Intervalos configurables para balancear tiempo real vs. recursos
- **UI**: Indicadores de carga y estados de error

## Consideraciones de Rendimiento

- **Intervalo Recomendado**: 5 segundos para uso normal
- **Intervalo Mínimo**: 1 segundo (solo para monitoreo crítico)
- **Intervalo Máximo**: 1 minuto (para conservar recursos)

## Extensibilidad

El sistema está diseñado para ser extensible:
- Nuevos tipos de notificaciones
- Métricas adicionales
- Filtros avanzados
- Exportación de datos
- Integración con sistemas externos