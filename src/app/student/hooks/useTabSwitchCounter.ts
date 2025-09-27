import { useEffect, useRef, useState } from 'react';

interface UseTabSwitchCounterProps {
  enabled?: boolean;
  onTabSwitch?: (count: number) => void;
  onPunishmentTrigger?: (count: number) => void; // Callback para activar el modal de pausa de seguridad
  onRedirect?: (count: number) => void; // Callback para redirigir después de 20 detecciones
}

export function useTabSwitchCounter({
  enabled = true,
  onTabSwitch,
  onPunishmentTrigger,
  onRedirect
}: UseTabSwitchCounterProps = {}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const onTabSwitchRef = useRef(onTabSwitch);
  const onPunishmentTriggerRef = useRef(onPunishmentTrigger);
  const onRedirectRef = useRef(onRedirect);
  const isInitializedRef = useRef(false);

  // Actualizar referencias cuando cambien las funciones
  useEffect(() => {
    onTabSwitchRef.current = onTabSwitch;
  }, [onTabSwitch]);

  useEffect(() => {
    onPunishmentTriggerRef.current = onPunishmentTrigger;
  }, [onPunishmentTrigger]);

  useEffect(() => {
    onRedirectRef.current = onRedirect;
  }, [onRedirect]);

  // Cargar contador desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      const savedCount = localStorage.getItem('tabSwitchCount');
      if (savedCount) {
        const count = parseInt(savedCount, 10);
        setTabSwitchCount(count);
      }
      isInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let lastSwitchTime = 0;
    const DEBOUNCE_TIME = 100; // 100ms para evitar eventos duplicados

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        
        // Evitar incrementos duplicados usando debounce
        if (now - lastSwitchTime < DEBOUNCE_TIME) {
          return;
        }
        
        lastSwitchTime = now;
        
        // La página perdió el foco - incrementar contador
        setTabSwitchCount(prevCount => {
          const newCount = prevCount + 1;
          
          // Guardar en localStorage
          localStorage.setItem('tabSwitchCount', newCount.toString());
          
          // Llamar callback si existe
          if (onTabSwitchRef.current) {
            onTabSwitchRef.current(newCount);
          }

          // Implementar las nuevas reglas de detección
          if (newCount > 20) {
            // Después de 20 detecciones, redirigir en cada detección adicional
            if (onRedirectRef.current) {
              onRedirectRef.current(newCount);
            }
          } else if (newCount > 12) {
            // Después de 12 detecciones, activar modal en cada detección adicional
            console.warn(`[Tab Switch] ¡Pausa de seguridad activada! ${newCount} cambios de pestaña detectados`);
            if (onPunishmentTriggerRef.current) {
              onPunishmentTriggerRef.current(newCount);
            }
          } else if (newCount % 3 === 0) {
            // Hasta 12 detecciones, mostrar mensaje cada 3 detecciones
            console.warn(`[Tab Switch] ¡Pausa de seguridad activada! ${newCount} cambios de pestaña detectados`);
            if (onPunishmentTriggerRef.current) {
              onPunishmentTriggerRef.current(newCount);
            }
          }

          console.info(`[Tab Switch] Cambio de pestaña detectado. Total: ${newCount}`);
          
          return newCount;
        });
      }
    };

    // Solo usar visibilitychange que es más confiable y evita duplicados
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Función para resetear el contador
  const resetTabSwitchCount = () => {
    setTabSwitchCount(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tabSwitchCount');
    }
  };

  // Función para obtener el contador actual
  const getCurrentCount = () => tabSwitchCount;

  return {
    tabSwitchCount,
    resetTabSwitchCount,
    getCurrentCount
  };
}