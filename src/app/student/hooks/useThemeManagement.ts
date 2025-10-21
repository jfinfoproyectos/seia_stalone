import { useState, useEffect, useCallback } from 'react';

export function useThemeManagement() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Limpiar cualquier clase de tema personalizado previamente aplicada
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove(
        'purple-theme','amber-theme','blue-theme','bold-tech','notebook','candyland','graphite','nature','perpetuity','quantum-rose','twitter','caffeine','cyberpunk','darkmatter','modern-minimal','tangerine'
      );
    }
  }, []);

  const restoreTheme = useCallback(() => {
    // next-themes gestiona la persistencia; no hacemos nada extra
  }, []);


  const clearCustomThemes = useCallback(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.remove(
      'purple-theme','amber-theme','blue-theme','bold-tech','notebook','candyland','graphite','nature','perpetuity','quantum-rose','twitter','caffeine','cyberpunk','darkmatter','modern-minimal','tangerine'
    );
  }, []);

  return {
    mounted,
    restoreTheme,
    clearCustomThemes
  };
}