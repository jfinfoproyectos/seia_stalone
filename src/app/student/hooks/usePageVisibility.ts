import { useState, useEffect, useRef } from 'react';

export function usePageVisibility() {
  const [isPageHidden, setIsPageHidden] = useState(false);
  const originalTitleRef = useRef<string>('');

  // Efecto para detectar cuando la página está oculta
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);



  // Función para establecer el título original (mantenida para compatibilidad)
  const setOriginalTitle = (title: string) => {
    originalTitleRef.current = title;
  };

  return {
    isPageHidden,
    setOriginalTitle
  };
}