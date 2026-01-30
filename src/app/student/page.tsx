'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PenTool, Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useStudentData } from './hooks/useStudentData'
import { useThemeManagement } from './hooks/useThemeManagement'
import { Alert, AlertDescription } from '@/components/ui/alert'



export default function StudentEntryPage() {
  const [uniqueCode, setUniqueCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [redirectMessage, setRedirectMessage] = useState('')
  const [acceptDataPolicy, setAcceptDataPolicy] = useState(false)
  const router = useRouter()

  // Usar hooks para manejar datos del estudiante y tema
  const { saveStudentData, clearStudentData } = useStudentData()
  const { mounted, restoreTheme } = useThemeManagement()



  // Restaurar el tema seleccionado al cargar la página
  useEffect(() => {
    if (mounted) {
      restoreTheme()
    }
  }, [mounted, restoreTheme])

  // Mostrar aviso si se regresó por cambio de pestaña
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reason = sessionStorage.getItem('redirectReason')
    if (reason === 'tab-switch') {
      setRedirectMessage('La evaluación se cerró porque cambiaste de pestaña o la ventana perdió el foco. Por normas del examen, debes permanecer en la pantalla de evaluación hasta finalizar.')
      sessionStorage.removeItem('redirectReason')
    }
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Limpiar errores previos

    // Limpiar almacenamiento antes de iniciar nueva sesión
    clearStudentData()

    if (!uniqueCode.trim()) {
      setError('Por favor, ingresa el código de evaluación')
      return
    }

    // Validar datos del estudiante
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Por favor, completa todos los campos')
      return
    }

    // Requerir autorización de tratamiento de datos personales
    if (!acceptDataPolicy) {
      setError('Debes autorizar el tratamiento de tus datos personales para continuar')
      return
    }

    // Validar API key antes de continuar

    setLoading(true)

    try {
      // Guardar los datos usando el hook
      const studentData = { email, firstName, lastName }
      saveStudentData(studentData)

      // Redirigir solo con el código en la URL
      router.push(`/student/evaluation?code=${uniqueCode}`);
    } catch (error) {
      console.error('Error al iniciar la evaluación:', error)
      setError('Error al iniciar la evaluación. Por favor, intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background overflow-hidden">
      <div className="w-full max-w-5xl px-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center gap-2 glow-effect">
              <PenTool className="h-6 w-6 text-primary blur-effect" />
              <CardTitle className="text-2xl font-bold text-center">SEIA</CardTitle>
            </div>
            <CardDescription className="text-center">
              Ingresa el código de evaluación y tus datos personales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {redirectMessage && (
                <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                  <AlertDescription>{redirectMessage}</AlertDescription>
                </Alert>
              )}
              {/* Nota informativa compacta y resaltada sobre la correcta diligencia de datos */}
              <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 px-2 py-1 text-xs leading-tight dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                <Info className="h-3 w-3 mt-[1px]" />
                <p>
                  <span className="font-semibold">Importante:</span> diligencia tus datos completa y correctamente para tu identificación. Para recuperar el avance de la evaluación, usa el <span className="font-semibold">mismo correo electrónico</span>. Los <span className="font-semibold">nombres y apellidos mal diligenciados</span> no serán tenidos en cuenta por el profesor.
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md dark:text-red-200 dark:bg-red-950 dark:border-red-900">
                  {error}
                </div>
              )}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna izquierda: código y correo */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código de Evaluación</Label>
                      <Input
                        id="code"
                        placeholder="Ingresa el código de 8 caracteres"
                        value={uniqueCode}
                        onChange={(e) => setUniqueCode(e.target.value)}
                        maxLength={8}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Ingresa tu correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Columna derecha: nombres y apellidos */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombres</Label>
                      <Input
                        id="firstName"
                        placeholder="Ej: Juan Sebastián"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        placeholder="Ej: Pérez Gómez"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aviso de privacidad y autorización de datos personales (Colombia) */}
              <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
                <p>
                  Tratamiento de datos personales en Colombia conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, bajo la vigilancia de la SIC. Los datos solicitados (nombres, apellidos y correo) se usan para identificarte, gestionar tu participación en la evaluación y enviarte comunicaciones académicas.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox id="dataAuth" checked={acceptDataPolicy} onCheckedChange={(v) => setAcceptDataPolicy(!!v)} className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <label htmlFor="dataAuth" className="leading-tight">
                    Autorizo el tratamiento de mis datos personales (nombres, apellidos y correo) para los fines descritos, y reconozco mis derechos de conocer, actualizar, rectificar, suprimir datos y revocar la autorización.
                    {" "}
                    <span className="text-muted-foreground">Política de privacidad disponible para consulta.</span>
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Iniciando...' : 'Comenzar Evaluación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}