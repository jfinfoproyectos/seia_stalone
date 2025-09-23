"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sun, Moon, Palette, Monitor, Droplets, Zap, BookOpen, Candy, Pencil, Leaf, Clock, Flower, MessageCircle, Coffee, Cpu, Atom, Minimize2, Citrus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";

interface ThemeToggleProps {
  className?: string;
}

// Definición de los temas disponibles
interface ThemeOption {
  name: string;
  value: string;
  description?: string;
  colors?: {
    primary: string;
    background: string;
    accent: string;
  };
}

// Función para obtener el icono apropiado para cada tema
const getThemeIcon = (themeValue: string) => {
  switch (themeValue) {
    case "light":
      return <Sun className="w-4 h-4" />;
    case "dark":
      return <Moon className="w-4 h-4" />;
    case "system":
      return <Monitor className="w-4 h-4" />;
    case "purple-theme":
      return <Droplets className="w-4 h-4" />;
    case "amber-theme":
      return <Sun className="w-4 h-4" />;
    case "blue-theme":
      return <Droplets className="w-4 h-4" />;
    case "bold-tech":
      return <Zap className="w-4 h-4" />;
    case "notebook":
      return <BookOpen className="w-4 h-4" />;
    case "candyland":
      return <Candy className="w-4 h-4" />;
    case "graphite":
      return <Pencil className="w-4 h-4" />;
    case "nature":
      return <Leaf className="w-4 h-4" />;
    case "perpetuity":
      return <Clock className="w-4 h-4" />;
    case "quantum-rose":
      return <Flower className="w-4 h-4" />;
    case "twitter":
      return <MessageCircle className="w-4 h-4" />;
    case "caffeine":
      return <Coffee className="w-4 h-4" />;
    case "cyberpunk":
      return <Cpu className="w-4 h-4" />;
    case "darkmatter":
      return <Atom className="w-4 h-4" />;
    case "modern-minimal":
      return <Minimize2 className="w-4 h-4" />;
    case "tangerine":
      return <Citrus className="w-4 h-4" />;
    default:
      return <Palette className="w-4 h-4" />;
  }
};

// Componente para mostrar la paleta de colores del tema
const ThemePalette = ({ colors }: { colors: ThemeOption["colors"] }) => {
  if (!colors) return null;
  
  return (
    <div className="flex gap-1 mr-2">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.background }}
        title="Color de fondo"
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.primary }}
        title="Color primario"
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.accent }}
        title="Color de acento"
      />
    </div>
  );
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [customTheme, setCustomTheme] = useState<string | null>(null);
  
  // Aplicar un tema específico
  const applyTheme = useCallback((themeValue: string) => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    // Eliminar cualquier clase de tema anterior
    document.documentElement.classList.remove(
      "purple-theme",
      "amber-theme",
      "blue-theme",
      "bold-tech",
      "notebook",
      "candyland",
      "graphite",
      "nature",
      "perpetuity",
      "quantum-rose",
      "twitter",
      "caffeine",
      "cyberpunk",
      "darkmatter",
      "modern-minimal",
      "tangerine",
    );
    
    // Guardar el tema seleccionado en localStorage para recordarlo
    localStorage.setItem('selected-theme', themeValue);
    
    // Si es un tema personalizado, agregar la clase correspondiente
    if (themeValue !== "light" && themeValue !== "dark" && themeValue !== "system") {
      document.documentElement.classList.add(themeValue);
      setCustomTheme(themeValue);
      
      // Para el tema twitter, establecer modo claro por defecto
      if (themeValue === "twitter") {
        document.documentElement.classList.remove('dark');
        setTheme('light');
      } else {
        // Para otros temas personalizados, mantener el modo claro/oscuro actual
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentTheme = theme || 'system';
        const isDark = currentTheme === "dark" || (currentTheme === "system" && prefersDark);
        
        // Mantener el modo oscuro/claro actual usando setTheme
        if (isDark) {
          document.documentElement.classList.add('dark');
          // Asegurarse de que next-themes sepa que estamos en modo oscuro
          setTheme('dark');
        } else {
          document.documentElement.classList.remove('dark');
          // Asegurarse de que next-themes sepa que estamos en modo claro
          setTheme('light');
        }
      }
    } else {
      // Para temas estándar (light/dark/system), usar next-themes
      setTheme(themeValue);
      setCustomTheme(null);
    }
  }, [theme, setTheme, setCustomTheme]);
  
  // Asegurarse de que el componente esté montado antes de realizar operaciones del lado del cliente
  useEffect(() => {
    setMounted(true);
    
    // Restaurar el tema personalizado si existe en localStorage o establecer twitter por defecto
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('selected-theme');
      if (savedTheme && savedTheme !== 'light' && savedTheme !== 'dark' && savedTheme !== 'system') {
        setCustomTheme(savedTheme);
      } else {
        // Establecer twitter como predeterminado si no hay tema guardado
        setCustomTheme('twitter');
        applyTheme('twitter');
      }
    }
  }, [applyTheme]);

  // Asegurarse de que el componente solo se renderice en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Restaurar el tema seleccionado al cargar la página
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      applyTheme(savedTheme);
      
      // Si es un tema personalizado, actualizar el estado
      if (savedTheme !== "light" && savedTheme !== "dark" && savedTheme !== "system") {
        setCustomTheme(savedTheme);
      }
    } else {
      // Si no hay tema guardado, aplicar twitter como predeterminado
      applyTheme("twitter");
      setCustomTheme("twitter");
    }
  }, [applyTheme]);

  // Definir los temas disponibles
  const basicThemes: ThemeOption[] = [
    { 
      name: "Light", 
      value: "light", 
      description: "Tema claro predeterminado",
      colors: {
        background: "#ffffff",
        primary: "#000000",
        accent: "#6e6e6e"
      }
    },
    { 
      name: "Dark", 
      value: "dark", 
      description: "Tema oscuro predeterminado",
      colors: {
        background: "#1c1c1c",
        primary: "#ffffff",
        accent: "#6e6e6e"
      }
    },
    { 
      name: "System", 
      value: "system", 
      description: "Basado en la configuración del sistema",
      colors: {
        background: "#f5f5f5",
        primary: "#1c1c1c",
        accent: "#6e6e6e"
      }
    },
  ];
  
  const customThemes: ThemeOption[] = [
    { 
      name: "Purple", 
      value: "purple-theme", 
      description: "Tema con tonos morados",
      colors: {
        background: "#f8f7ff",
        primary: "#ac4cb7",
        accent: "#e4f1e4"
      }
    },
    { 
      name: "Amber", 
      value: "amber-theme", 
      description: "Tema con tonos ámbar",
      colors: {
        background: "#fffaf0",
        primary: "#bb8a35",
        accent: "#d4a95f"
      }
    },
    { 
      name: "Blue", 
      value: "blue-theme", 
      description: "Tema con tonos azules",
      colors: {
        background: "#f0f8ff",
        primary: "#3b82f6",
        accent: "#93c5fd"
      }
    },
    { 
      name: "Bold Tech", 
      value: "bold-tech", 
      description: "Tema con estilo tecnológico",
      colors: {
        background: "#ffffff",
        primary: "#9b4dff",
        accent: "#eef2ff"
      }
    },
    { 
      name: "Notebook", 
      value: "notebook", 
      description: "Tema estilo cuaderno",
      colors: {
        background: "#fafafa",
        primary: "#7d7d7d",
        accent: "#f0e68c"
      }
    },
    { 
      name: "Candyland", 
      value: "candyland", 
      description: "Tema dulce y colorido",
      colors: {
        background: "#fff5f8",
        primary: "#ff69b4",
        accent: "#ffb6c1"
      }
    },
    { 
      name: "Graphite", 
      value: "graphite", 
      description: "Tema elegante en grises",
      colors: {
        background: "#f8f9fa",
        primary: "#495057",
        accent: "#6c757d"
      }
    },
    { 
      name: "Nature", 
      value: "nature", 
      description: "Tema inspirado en la naturaleza",
      colors: {
        background: "#f0fff0",
        primary: "#228b22",
        accent: "#90ee90"
      }
    },
    { 
      name: "Perpetuity", 
      value: "perpetuity", 
      description: "Tema atemporal",
      colors: {
        background: "#fafafa",
        primary: "#2c3e50",
        accent: "#34495e"
      }
    },
    { 
      name: "Quantum Rose", 
      value: "quantum-rose", 
      description: "Tema rosa cuántico",
      colors: {
        background: "#fff0f5",
        primary: "#c71585",
        accent: "#dda0dd"
      }
    },
    { 
      name: "Twitter", 
      value: "twitter", 
      description: "Tema inspirado en Twitter",
      colors: {
        background: "#f7f9fa",
        primary: "#1da1f2",
        accent: "#71c9f8"
      }
    },
    { 
      name: "Caffeine", 
      value: "caffeine", 
      description: "Tema inspirado en el café",
      colors: {
        background: "#faf6f0",
        primary: "#8b4513",
        accent: "#d2b48c"
      }
    },
    { 
      name: "Cyberpunk", 
      value: "cyberpunk", 
      description: "Tema futurista cyberpunk",
      colors: {
        background: "#0a0a0a",
        primary: "#00ff41",
        accent: "#ff0080"
      }
    },
    { 
      name: "Dark Matter", 
      value: "darkmatter", 
      description: "Tema oscuro como la materia oscura",
      colors: {
        background: "#1a1a1a",
        primary: "#b8860b",
        accent: "#4169e1"
      }
    },
    { 
      name: "Modern Minimal", 
      value: "modern-minimal", 
      description: "Tema minimalista moderno",
      colors: {
        background: "#ffffff",
        primary: "#6231a8",
        accent: "#f3f4f6"
      }
    },
    { 
      name: "Tangerine", 
      value: "tangerine", 
      description: "Tema inspirado en la mandarina",
      colors: {
        background: "#fef3e2",
        primary: "#ea580c",
        accent: "#fed7aa"
      }
    },
  ];

  // Obtener el nombre del tema personalizado actual
  // const getCurrentCustomThemeName = () => {
  //   if (!mounted || !customTheme) return "";
  //   const current = customThemes.find(t => t.value === customTheme);
  //   return current ? current.name : "";
  // };

  // Alternar entre modo claro y oscuro
  const toggleLightDark = () => {
    // Si hay un tema personalizado activo, solo cambiamos el modo claro/oscuro
    // pero mantenemos el tema personalizado
    if (customTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = theme || 'system';
      const isDark = currentTheme === "dark" || (currentTheme === "system" && prefersDark);
      
      // Cambiar entre modo claro y oscuro manteniendo el tema personalizado
      if (isDark) {
        document.documentElement.classList.remove('dark');
        setTheme("light");
      } else {
        document.documentElement.classList.add('dark');
        setTheme("dark");
      }
      
      // Guardar el tema personalizado en localStorage para mantenerlo
      localStorage.setItem('selected-theme', customTheme);
    } else {
      // Si no hay tema personalizado, simplemente alternamos entre light y dark
      const newTheme = theme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
    }
  };

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="h-7 w-7">
          <Sun className="h-[0.9rem] w-[0.9rem]" />
          <span className="sr-only">Cargando temas</span>
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7">
          <Palette className="h-[0.9rem] w-[0.9rem]" />
          <span className="sr-only">Cargando temas</span>
        </Button>
      </div>
    );
  }

  // Evitar renderizado en el servidor para prevenir errores de hidratación
  if (!mounted) {
    return <Button variant="ghost" size="icon" className={cn("w-9 h-9", className)} disabled>
      <Palette className="h-4 w-4" />
    </Button>;
  }
  
  return (
    <div className={cn("flex gap-2", className)}>
      {/* Botón para alternar entre claro y oscuro */}
      <Button 
        variant="outline" 
        size="icon"
        className="border h-7 w-7" style={{ borderColor: 'var(--border)' }}
        onClick={toggleLightDark}
      >
        <div className="relative w-[0.9rem] h-[0.9rem]">
          <Sun className="absolute inset-0 h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute inset-0 h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </div>
        <span className="sr-only">Alternar modo claro/oscuro</span>
      </Button>
      
      {/* Botón para seleccionar temas personalizados */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="border h-7 w-7" style={{ borderColor: 'var(--border)' }}
          >
            <Palette className="h-[0.9rem] w-[0.9rem]" />
            <span className="sr-only">Selector de tema personalizado</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Temas personalizados</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => applyTheme("system")}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              {getThemeIcon("system")}
              <ThemePalette colors={basicThemes.find(t => t.value === "system")?.colors} />
              <span>Predeterminado (Sistema)</span>
            </div>
            {!customTheme && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
          {customThemes.map((themeOption) => (
            <DropdownMenuItem 
              key={themeOption.value}
              onClick={() => applyTheme(themeOption.value)}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                {getThemeIcon(themeOption.value)}
                <ThemePalette colors={themeOption.colors} />
                <span>{themeOption.name}</span>
              </div>
              {customTheme === themeOption.value && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>    
  );
}