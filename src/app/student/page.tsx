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
import { setApiKeyInStorage, validateApiKeyFormat } from '@/lib/apiKeyService'
import { GoogleGenAI } from '@google/genai'
import { Alert, AlertDescription } from '@/components/ui/alert'



export default function StudentEntryPage() {
  const [uniqueCode, setUniqueCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [apiKeyError, setApiKeyError] = useState('')
  const [apiKeyValidating, setApiKeyValidating] = useState(false)
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

  const verifyApiKey = async (key: string): Promise<boolean> => {
    setApiKeyValidating(true)
    setApiKeyError('')
    try {
      if (!key || !validateApiKeyFormat(key)) {
        setApiKeyStatus('invalid')
        setApiKeyError('Formato de API key inválido')
        return false
      }

      const genAI = new GoogleGenAI({ apiKey: key })
      // Petición mínima para validar la API key
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: 'Responde exactamente: OK'
      })
      const text = response.text?.trim() || ''
      if (!text) {
        throw new Error('Sin respuesta del modelo')
      }
      setApiKeyStatus('valid')
      return true
    } catch (e) {
      console.error('Error al validar API key:', e)
      setApiKeyStatus('invalid')
      setApiKeyError('La API key no es válida o hubo un error de conexión')
      return false
    } finally {
      setApiKeyValidating(false)
    }
  }

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
    if (!apiKey.trim()) {
      setError('Por favor, ingresa tu API key de Gemini')
      return
    }

    const isValidKey = await verifyApiKey(apiKey.trim())
    if (!isValidKey) {
      setError('API key inválida o no funcional. Verifícala antes de continuar.')
      return
    }

    setLoading(true)
    
    try {
      // Guardar los datos usando el hook
      const studentData = { email, firstName, lastName }
      saveStudentData(studentData)
      // Guardar API key localmente para uso en la evaluación
      setApiKeyInStorage(apiKey.trim())
      
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
              Ingresa el código de evaluación, tus datos y tu API key de Gemini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {redirectMessage && (
                <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                  <AlertDescription>{redirectMessage}</AlertDescription>
                </Alert>
              )}
              {/* Nota informativa compacta y resaltada sobre la correcta diligencia de datos */}
              <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 px-2 py-1 text-xs leading-tight dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <Info className="h-3 w-3 mt-[1px]" />
                <p>
                  <span className="font-semibold">Importante:</span> diligencia tus datos completa y correctamente para tu identificación. Para recuperar el avance de la evaluación, usa el <span className="font-semibold">mismo correo electrónico</span>. Los <span className="font-semibold">nombres y apellidos mal diligenciados</span> no serán tenidos en cuenta por el profesor.
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-950 dark:border-red-800">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda: datos y código */}
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

                {/* Columna derecha: API key integrada */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API key de Gemini</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se validará con una petición rápida.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Finalidad: habilita el uso de los servicios de Gemini para evaluar tus respuestas directamente desde tu navegador.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Ej: AIza..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setApiKeyStatus('idle')
                        setApiKeyError('')
                      }}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => verifyApiKey(apiKey)}
                      disabled={apiKeyValidating || !apiKey}
                    >
                      {apiKeyValidating ? 'Verificando...' : 'Verificar API key'}
                    </Button>
                    {apiKeyStatus === 'valid' && (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">Válida</span>
                    )}
                    {apiKeyStatus === 'invalid' && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">Inválida</span>
                    )}
                  </div>
                  {apiKeyError && (
                    <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-950 dark:border-red-800">
                      {apiKeyError}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tu API key se guarda únicamente en tu navegador (localStorage) para esta sesión.
                    No se envía ni almacena en nuestros servidores.
                    Puedes obtener una API key en Google AI Studio:
                    {' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      https://aistudio.google.com/app/apikey
                    </a>
                  </p>
                </div>
              </div>

              {/* Aviso de privacidad y autorización de datos personales (Colombia) */}
              <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs dark:border-blue-900 dark:bg-blue-950">
                <p>
                  Tratamiento de datos personales en Colombia conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, bajo la vigilancia de la SIC. Los datos solicitados (nombres, apellidos y correo) se usan para identificarte, gestionar tu participación en la evaluación y enviarte comunicaciones académicas.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox id="dataAuth" checked={acceptDataPolicy} onCheckedChange={(v) => setAcceptDataPolicy(!!v)} />
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
                  disabled={loading || apiKeyValidating}
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