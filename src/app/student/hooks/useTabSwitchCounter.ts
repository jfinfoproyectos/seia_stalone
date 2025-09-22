import { useEffect, useRef, useState } from 'react';

interface UseTabSwitchCounterProps {
  enabled?: boolean;
  onTabSwitch?: (count: number) => void;
}

export function useTabSwitchCounter({
  enabled = true,
  onTabSwitch
}: UseTabSwitchCounterProps = {}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const onTabSwitchRef = useRef(onTabSwitch);
  const isInitializedRef = useRef(false);

  // Actualizar referencia cuando cambie la función
  useEffect(() => {
    onTabSwitchRef.current = onTabSwitch;
  }, [onTabSwitch]);

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