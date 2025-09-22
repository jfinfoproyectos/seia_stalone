import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseFocusRedirectProps {
  enabled?: boolean;
  redirectPath?: string;
  gracePeriod?: number; // Tiempo de gracia en milisegundos antes de redirigir
  onFocusLost?: () => void;
  onRedirect?: () => void;
}

export function useFocusRedirect({
  enabled = true,
  redirectPath = '/student',
  gracePeriod = 1000, // 3 segundos por defecto
  onFocusLost,
  onRedirect
}: UseFocusRedirectProps = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRedirectingRef = useRef(false);
  const onFocusLostRef = useRef(onFocusLost);
  const onRedirectRef = useRef(onRedirect);

  // Actualizar referencias cuando cambien las funciones
  useEffect(() => {
    onFocusLostRef.current = onFocusLost;
    onRedirectRef.current = onRedirect;
  }, [onFocusLost, onRedirect]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isRedirectingRef.current) {
        // La página perdió el foco
        console.warn('[Security] Pérdida de foco detectada en la evaluación');
        
        // Llamar callback si existe
        if (onFocusLostRef.current) {
          onFocusLostRef.current();
        }

        // Configurar timeout para redirección
        timeoutRef.current = setTimeout(() => {
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true;
            
            // Llamar callback de redirección si existe
            if (onRedirectRef.current) {
              onRedirectRef.current();
            }

            console.warn('[Security] Redirigiendo por pérdida de foco prolongada');
            
            // Limpiar datos de sesión por seguridad
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('studentData');
              sessionStorage.removeItem('evaluationAnswers');
              sessionStorage.removeItem('evaluationProgress');
            }

            // Redirigir
            router.push(redirectPath);
          }
        }, gracePeriod);
      } else if (!document.hidden && timeoutRef.current) {
        // La página recuperó el foco antes del timeout
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        console.info('[Security] Foco recuperado, cancelando redirección');
      }
    };

    const handleWindowBlur = () => {
      if (!isRedirectingRef.current) {
        console.warn('[Security] Ventana perdió el foco');
        
        // Llamar callback si existe
        if (onFocusLostRef.current) {
          onFocusLostRef.current();
        }

        // Configurar timeout para redirección
        timeoutRef.current = setTimeout(() => {
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true;
            
            // Llamar callback de redirección si existe
            if (onRedirectRef.current) {
              onRedirectRef.current();
            }

            console.warn('[Security] Redirigiendo por pérdida de foco de ventana');
            
            // Limpiar datos de sesión por seguridad
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('studentData');
              sessionStorage.removeItem('evaluationAnswers');
              sessionStorage.removeItem('evaluationProgress');
            }

            // Redirigir
            router.push(redirectPath);
          }
        }, gracePeriod);
      }
    };

    const handleWindowFocus = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        console.info('[Security] Ventana recuperó el foco, cancelando redirección');
      }
    };

    const handleBeforeUnload = () => {
      // Limpiar timeout si el usuario está cerrando la página
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Agregar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, redirectPath, gracePeriod, router]);

  // Función para deshabilitar manualmente el hook
  const disableFocusRedirect = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isRedirectingRef.current = true;
  };

  // Función para habilitar manualmente el hook
  const enableFocusRedirect = () => {
    isRedirectingRef.current = false;
  };

  return {
    disableFocusRedirect,
    enableFocusRedirect,
    isRedirecting: isRedirectingRef.current
  };
}