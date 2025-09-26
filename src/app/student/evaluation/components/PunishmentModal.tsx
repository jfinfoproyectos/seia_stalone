'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Lock, Timer, Shield, AlertTriangle } from 'lucide-react'

interface SecurityPauseModalProps {
  isOpen: boolean
  tabSwitchCount: number
  onComplete: () => void
}

interface SecurityPauseState {
  isActive: boolean
  timeLeft: number
  startTime: number
  tabSwitchCount: number
}

export function PunishmentModal({ isOpen, tabSwitchCount, onComplete }: SecurityPauseModalProps) {
  const [timeLeft, setTimeLeft] = useState(30) // 30 segundos de pausa
  const [isCompleted, setIsCompleted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar estado persistente al inicializar
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    const savedState = localStorage.getItem('securityPauseState')
    if (savedState) {
      try {
        const state: SecurityPauseState = JSON.parse(savedState)
        const now = Date.now()
        const elapsed = Math.floor((now - state.startTime) / 1000)
        const remainingTime = Math.max(0, 30 - elapsed)

        if (state.isActive && remainingTime > 0) {
          setTimeLeft(remainingTime)
          setIsCompleted(false)
        } else if (state.isActive && remainingTime <= 0) {
          // El tiempo ya expiró, limpiar estado
          localStorage.removeItem('securityPauseState')
          setIsCompleted(true)
          setTimeLeft(0)
        }
      } catch (error) {
        console.error('Error al cargar estado de pausa de seguridad:', error)
        localStorage.removeItem('securityPauseState')
      }
    }
    setIsInitialized(true)
  }, [])

  // Guardar estado cuando se abre el modal
  useEffect(() => {
    if (!isInitialized) return

    if (isOpen && timeLeft === 30) {
      // Modal recién abierto, guardar estado inicial
      const state: SecurityPauseState = {
        isActive: true,
        timeLeft: 30,
        startTime: Date.now(),
        tabSwitchCount
      }
      localStorage.setItem('securityPauseState', JSON.stringify(state))
    } else if (!isOpen) {
      // Modal cerrado, limpiar estado
      localStorage.removeItem('securityPauseState')
      setTimeLeft(30)
      setIsCompleted(false)
    }
  }, [isOpen, tabSwitchCount, timeLeft, isInitialized])

  // Timer principal
  useEffect(() => {
    if (!isOpen || !isInitialized) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = prev - 1
        
        // Actualizar estado en localStorage
        if (newTimeLeft > 0) {
          const savedState = localStorage.getItem('securityPauseState')
          if (savedState) {
            try {
              const state: SecurityPauseState = JSON.parse(savedState)
              state.timeLeft = newTimeLeft
              localStorage.setItem('securityPauseState', JSON.stringify(state))
            } catch (error) {
              console.error('Error al actualizar estado:', error)
            }
          }
        }

        if (newTimeLeft <= 0) {
          setIsCompleted(true)
          // Limpiar estado de localStorage
          localStorage.removeItem('securityPauseState')
          // Auto-cerrar el modal cuando termine el tiempo
          setTimeout(() => {
            onComplete()
          }, 1000) // Esperar 1 segundo para mostrar el botón antes de cerrar
          return 0
        }
        return newTimeLeft
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onComplete, isInitialized])

  const handleComplete = () => {
    onComplete()
  }

  const progress = ((30 - timeLeft) / 30) * 100

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con efecto blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" />
      
      {/* Contenedor principal flotante */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Barra superior con gradiente */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20" />
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              {/* Indicador de seguridad con animación */}
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                <Lock className="w-6 h-6 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Pausa de Seguridad Activada
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Protocolo de Integridad
                  </span>
                </div>
              </div>
            </div>

            {/* Contador principal */}
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </div>
              <p className="text-sm text-muted-foreground">Tiempo de Espera</p>
            </div>
          </div>
        </div>

        {/* Contenido principal en layout horizontal */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Panel izquierdo - Información principal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                      {tabSwitchCount} cambios de pestaña detectados
                    </h3>
                    <p className="text-orange-700 dark:text-orange-300 text-sm leading-relaxed">
                      Por motivos de seguridad académica, se ha activado una pausa temporal. 
                      Esta medida garantiza la integridad del proceso de evaluación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-sm">Política de Integridad</h4>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Evite cambiar de pestaña durante la evaluación. Cada 3 cambios activarán esta pausa de seguridad.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-2">
                    Reanudación Automática
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    La evaluación se reanudará automáticamente. Esta ventana no puede cerrarse manualmente.
                  </p>
                </div>
              </div>
            </div>

            {/* Panel derecho - Progreso circular */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative w-32 h-32">
                {/* Círculo de progreso */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    className="text-orange-600 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Contenido central del círculo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Timer className="w-6 h-6 text-orange-600 mb-1" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      minutos:segundos
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center w-full">
                <div className="text-xl font-bold text-orange-600 mb-2">
                  {Math.round(progress)}%
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>

              {isCompleted && (
                <Button 
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl w-full"
                >
                  Continuar Evaluación
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}