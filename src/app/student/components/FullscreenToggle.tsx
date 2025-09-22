'use client'

import { Button } from '@/components/ui/button'
import { Maximize, Minimize } from 'lucide-react'
import { useFullscreen } from '../hooks/useFullscreen'
import { cn } from '@/lib/utils'

interface FullscreenToggleProps {
  className?: string
}

/**
 * Componente que proporciona un botón para alternar entre modo de pantalla completa y ventana
 */
export function FullscreenToggle({ className }: FullscreenToggleProps) {
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen()

  // No mostrar el botón si el navegador no soporta pantalla completa
  if (!isSupported) {
    return null
  }

  const handleToggle = async () => {
    await toggleFullscreen()
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("border", className)}
      style={{ borderColor: 'var(--border)' }}
      onClick={handleToggle}
      title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
    >
      <div className="relative w-[0.9rem] h-[0.9rem]">
        {isFullscreen ? (
          <Minimize className="h-full w-full" />
        ) : (
          <Maximize className="h-full w-full" />
        )}
      </div>
      <span className="sr-only">
        {isFullscreen ? "Salir de pantalla completa" : "Entrar en pantalla completa"}
      </span>
    </Button>
  )
}