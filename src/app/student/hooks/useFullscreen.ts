'use client'

import { useState, useEffect, useCallback } from 'react'

// Interfaces para manejar las propiedades específicas del navegador
interface DocumentElementWithFullscreen extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

interface DocumentWithFullscreen extends Document {
  webkitExitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
  webkitFullscreenElement?: Element
  mozFullScreenElement?: Element
  msFullscreenElement?: Element
}

/**
 * Hook personalizado para manejar el modo de pantalla completa
 * Proporciona funciones para entrar, salir y alternar el modo de pantalla completa
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  // Verificar si el navegador soporta la API de pantalla completa
  useEffect(() => {
    const checkSupport = () => {
      const element = document.documentElement as DocumentElementWithFullscreen
      return !!(element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.mozRequestFullScreen ||
        element.msRequestFullscreen)
    }
    
    setIsSupported(checkSupport())
  }, [])

  // Función para entrar en modo de pantalla completa
  const enterFullscreen = useCallback(async () => {
    if (!isSupported) return false

    try {
      const element = document.documentElement as DocumentElementWithFullscreen
      
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
      
      return true
    } catch (error) {
      console.error('Error al entrar en pantalla completa:', error)
      return false
    }
  }, [isSupported])

  // Función para salir del modo de pantalla completa
  const exitFullscreen = useCallback(async () => {
    if (!isSupported) return false

    try {
      const doc = document as DocumentWithFullscreen
      
      if (doc.exitFullscreen) {
        await doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }
      
      return true
    } catch (error) {
      console.error('Error al salir de pantalla completa:', error)
      return false
    }
  }, [isSupported])

  // Función para alternar entre modo de pantalla completa y ventana
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return await exitFullscreen()
    } else {
      return await enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  // Escuchar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen
      const fullscreenElement = doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      
      setIsFullscreen(!!fullscreenElement)
    }

    // Agregar event listeners para diferentes navegadores
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  }
}