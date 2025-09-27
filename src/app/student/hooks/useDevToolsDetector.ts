'use client'

import { useEffect, useRef } from 'react'
import { addListener, removeListener, DevtoolsDetectorListener, launch } from 'devtools-detector'

interface UseDevToolsDetectorProps {
  enabled?: boolean
  onDevToolsOpen?: () => void
  onDevToolsClose?: () => void
}

export function useDevToolsDetector({
  enabled = true,
  onDevToolsOpen,
  onDevToolsClose
}: UseDevToolsDetectorProps = {}) {
  const listenerRef = useRef<DevtoolsDetectorListener | null>(null)

  useEffect(() => {
    if (!enabled) {
      console.log('[DevTools Detector] Hook deshabilitado')
      return
    }

    console.log('[DevTools Detector] Inicializando detector...')

    // Inicializar la detección
    try {
      launch()
      console.log('[DevTools Detector] Detector lanzado exitosamente')
    } catch (error) {
      console.error('[DevTools Detector] Error al lanzar detector:', error)
    }

    // Crear el listener
    const listener: DevtoolsDetectorListener = (isOpen, detail) => {
      console.log('[DevTools Detector] Estado cambiado:', { isOpen, detail })
      
      if (isOpen) {
        console.warn('[DevTools Detector] ¡DevTools detectadas como ABIERTAS!')
        onDevToolsOpen?.()
      } else {
        console.log('[DevTools Detector] DevTools cerradas')
        onDevToolsClose?.()
      }
    }

    listenerRef.current = listener
    addListener(listener)
    console.log('[DevTools Detector] Listener agregado exitosamente')

    // Cleanup al desmontar el componente
    return () => {
      if (listenerRef.current) {
        console.log('[DevTools Detector] Limpiando listener...')
        removeListener(listenerRef.current)
        listenerRef.current = null
      }
    }
  }, [enabled, onDevToolsOpen, onDevToolsClose])

  // Función para limpiar manualmente el listener
  const cleanup = () => {
    if (listenerRef.current) {
      removeListener(listenerRef.current)
      listenerRef.current = null
    }
  }

  return { cleanup }
}