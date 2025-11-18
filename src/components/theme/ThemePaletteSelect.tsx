"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Palette =
  | "zinc" | "slate" | "gray" | "neutral" | "stone"
  | "rose" | "pink" | "fuchsia" | "purple" | "violet" | "indigo"
  | "blue" | "sky" | "cyan" | "teal" | "emerald" | "green" | "lime"
  | "yellow" | "amber" | "orange" | "red";

interface ThemePaletteSelectProps {
  className?: string;
}

// Paletas disponibles (alineadas con las themes de shadcn)
const PALETTES: { value: Palette; label: string }[] = [
  { value: "zinc", label: "Zinc" },
  { value: "slate", label: "Slate" },
  { value: "gray", label: "Gray" },
  { value: "neutral", label: "Neutral" },
  { value: "stone", label: "Stone" },
  { value: "rose", label: "Rose" },
  { value: "pink", label: "Pink" },
  { value: "fuchsia", label: "Fuchsia" },
  { value: "purple", label: "Purple" },
  { value: "violet", label: "Violet" },
  { value: "indigo", label: "Indigo" },
  { value: "blue", label: "Blue" },
  { value: "sky", label: "Sky" },
  { value: "cyan", label: "Cyan" },
  { value: "teal", label: "Teal" },
  { value: "emerald", label: "Emerald" },
  { value: "green", label: "Green" },
  { value: "lime", label: "Lime" },
  { value: "yellow", label: "Yellow" },
  { value: "amber", label: "Amber" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
];

export default function ThemePaletteSelect({ className }: ThemePaletteSelectProps) {
  const [palette, setPalette] = useState<Palette>("violet");

  // Aplicar paleta desde storage o por defecto
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("palette") as Palette | null) ?? "violet";
      setPalette(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } catch {
      document.documentElement.setAttribute("data-theme", "violet");
    }
  }, []);

  const onChange = (value: string) => {
    const next = (value as Palette) ?? "violet";
    setPalette(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("palette", next);
    } catch {}
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={palette} onValueChange={onChange}>
        <SelectTrigger className="h-7 px-2 text-xs w-[140px] rounded-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-3 w-3 rounded-full border border-border" style={{ background: "var(--primary)" }} />
            <SelectValue placeholder="Tema" />
          </div>
        </SelectTrigger>
        <SelectContent className="text-sm">
          {PALETTES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full border border-border" style={{ background: "var(--primary)" }} />
                {p.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}