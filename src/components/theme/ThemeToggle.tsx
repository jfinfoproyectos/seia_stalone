"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar diferencias de hidratación
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn("h-7 w-7", className)}
        aria-label="Cambiar tema"
      >
        <Sun className="h-[0.9rem] w-[0.9rem]" />
      </Button>
    );
  }

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn("h-7 w-7", className)}
      aria-label="Cambiar tema claro/oscuro"
    >
      {isDark ? (
        <Moon className="h-[0.9rem] w-[0.9rem]" />
      ) : (
        <Sun className="h-[0.9rem] w-[0.9rem]" />
      )}
    </Button>
  );
}