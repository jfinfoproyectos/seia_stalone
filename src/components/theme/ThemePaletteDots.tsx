"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type DotPalette = "blue" | "green" | "orange" | "red" | "violet";

const DOTS: { value: DotPalette; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "violet", label: "Violet" },
];

const COLOR_MAP: Record<DotPalette, string> = {
  blue: "oklch(0.62 0.18 240)",
  green: "oklch(0.70 0.15 140)",
  orange: "oklch(0.78 0.13 55)",
  red: "oklch(0.64 0.22 25)",
  violet: "oklch(0.57 0.20 285)",
};


interface ThemePaletteDotsProps {
  className?: string;
}

export default function ThemePaletteDots({ className }: ThemePaletteDotsProps) {
  const [active, setActive] = useState<DotPalette>("blue");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("palette") as DotPalette | null;
      const initial = saved ?? "blue";
      setActive(initial);
      document.documentElement.setAttribute("data-theme", initial);
      if (!saved) {
        localStorage.setItem("palette", initial);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const applyTheme = (value: DotPalette) => {
    setActive(value);
    document.documentElement.setAttribute("data-theme", value);
    try {
      localStorage.setItem("palette", value);
    } catch {}
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {DOTS.map((d) => (
        <button
          key={d.value}
          type="button"
          aria-label={`Cambiar tema a ${d.label}`}
          onClick={() => applyTheme(d.value)}
          className={cn(
            "palette-dot size-5 rounded-full border transition-[box-shadow,border-color,transform]",
            "border-border hover:shadow-md hover:scale-[1.05]",
            active === d.value ? "ring-2 ring-ring" : "ring-0"
          )}
          style={{ background: COLOR_MAP[d.value] }}
        />
      ))}
    </div>
  );
}