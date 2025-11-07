"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = false,
  disableTransitionOnChange = true,
}: {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  // Limpiar persistencia del tema en cada carga para no guardar estado
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('theme');
      }
    } catch {
      // Ignorar errores de acceso a storage
    }
  }, []);

  return (
    <NextThemesProvider 
      attribute={attribute as "class" | "data-theme"}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}
