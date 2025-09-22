'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, HelpCircle, Loader2, Sparkles, XCircle, Key, Code, FileText, Zap, Copy, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GoogleGenAI } from '@google/genai'
import { CodeEditor } from '@/app/playground/components/code-editor'
import { MarkdownViewer } from '@/app/playground/components/markdown-viewer'

// Tipos para las preguntas generadas
type QuestionType = 'text' | 'code'

type GeneratedQuestion = {
  id: string
  type: QuestionType
  question: string
  answer?: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  language?: string
  createdAt: Date
}

type EvaluationResult = {
  score: number
  feedback: string
  suggestions: string[]
  grade: number
}

// Opciones de configuración
const QUESTION_TYPES = [
  { value: 'text', label: 'Pregunta Abierta', icon: FileText },
  { value: 'code', label: 'Código', icon: Code }
]

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Fácil', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'medium', label: 'Medio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'hard', label: 'Difícil', color: 'bg-destructive/20 text-destructive' }
]

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' }
]

export default function PlaygroundPage() {
  // Estados principales
  const [apiKey, setApiKey] = useState('')
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)
  const [activeTab, setActiveTab] = useState<'generator' | 'practice' | 'history'>('generator')
  
  // Estados del generador
  const [topic, setTopic] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType>('text')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [language, setLanguage] = useState('javascript')
  const [questionCount, setQuestionCount] = useState(1)
  const [customInstructions, setCustomInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Estados de práctica
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [practiceHistory, setPracticeHistory] = useState<{question: GeneratedQuestion, answer: string, result: EvaluationResult}[]>([])
  
  // Estados de UI
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Función para validar API Key
  const validateApiKey = useCallback(async (key: string) => {
    if (!key.trim()) {
      setIsApiKeyValid(false)
      return false
    }
    
    try {
      // Usar la librería @google/genai para validar la key
      const genAI = new GoogleGenAI({ apiKey: key })
      const model = 'gemini-2.0-flash'
      
      // Hacer una consulta simple para validar la key
      const result = await genAI.models.generateContent({
        model,
        contents: 'Test'
      })
      
      if (result.text) {
        setIsApiKeyValid(true)
        setError(null)
        return true
      } else {
        setIsApiKeyValid(false)
        setError('API Key inválida')
        return false
      }
    } catch {
      setIsApiKeyValid(false)
      setError('Error al validar API Key')
      return false
    }
  }, [])

  // Cargar API key desde localStorage al inicializar
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      validateApiKey(savedApiKey)
    }
  }, [validateApiKey])

  // Función para generar preguntas
  const generateQuestions = useCallback(async () => {
    if (!isApiKeyValid || !topic.trim()) {
      setError('Por favor ingresa un tema válido y una API Key válida')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = `Genera ${questionCount} pregunta(s) de tipo "${questionType}" sobre el tema "${topic}" con dificultad "${difficulty}".${questionType === 'code' ? ` El lenguaje de programación es ${language}.` : ''}${customInstructions ? ` Instrucciones adicionales: ${customInstructions}` : ''}

Formato de respuesta JSON:
{
  "questions": [
    {
      "question": "texto de la pregunta",
      "type": "${questionType}",

      "answer": "respuesta esperada o explicación",
      "explanation": "explicación detallada",
      "difficulty": "${difficulty}",
      "topic": "${topic}"${questionType === 'code' ? `,\n      "language": "${language}"` : ''}
    }
  ]
}`

      const genAI = new GoogleGenAI({ apiKey })
      const model = 'gemini-2.0-flash'
      
      const generateResult = await genAI.models.generateContent({
        model,
        contents: prompt
      })
      
      if (!generateResult.text) {
        throw new Error('Error al generar preguntas')
      }

      const generatedText = generateResult.text
      
      // Extraer JSON del texto generado
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON válido de la respuesta')
      }

      const parsedData = JSON.parse(jsonMatch[0])
      const newQuestions: GeneratedQuestion[] = parsedData.questions.map((q: Record<string, unknown>, index: number) => ({
        id: Date.now() + index + '',
        type: questionType,
        question: q.question,
        answer: q.answer,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: difficulty,
        topic: topic,
        language: questionType === 'code' ? language : undefined,
        createdAt: new Date()
      }))

      setGeneratedQuestions(prev => [...newQuestions, ...prev])
      setActiveTab('practice')
      setCurrentQuestionIndex(0)
      setUserAnswer('')
      setEvaluationResult(null)
      
    } catch (error) {
      console.error('Error:', error)
      setError('Error al generar preguntas. Verifica tu API Key y conexión.')
    } finally {
      setIsGenerating(false)
    }
  }, [apiKey, isApiKeyValid, topic, questionType, difficulty, language, questionCount, customInstructions])

  // Función para evaluar respuesta
  const evaluateAnswer = useCallback(async () => {
    if (!isApiKeyValid || !userAnswer.trim() || !generatedQuestions[currentQuestionIndex]) {
      setError('Por favor ingresa una respuesta válida')
      return
    }

    setIsEvaluating(true)
    setError(null)

    try {
      const currentQuestion = generatedQuestions[currentQuestionIndex]
      const prompt = `Evalúa la siguiente respuesta del estudiante:

Pregunta: ${currentQuestion.question}
Respuesta del estudiante: ${userAnswer}
Respuesta esperada: ${currentQuestion.answer}
${currentQuestion.explanation ? `Explicación: ${currentQuestion.explanation}` : ''}

Proporciona una evaluación en formato JSON:
{
  "score": número del 0 al 100,
  "grade": número del 0 al 5,
  "feedback": "retroalimentación constructiva",
  "suggestions": ["sugerencia1", "sugerencia2"]
}`

      const genAI = new GoogleGenAI({ apiKey })
      const model = 'gemini-2.0-flash'
      
      const evaluateResult = await genAI.models.generateContent({
        model,
        contents: prompt
      })
      
      if (!evaluateResult.text) {
        throw new Error('Error al evaluar respuesta')
      }

      const generatedText = evaluateResult.text
      
      // Extraer JSON del texto generado
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON válido de la respuesta')
      }

      const evaluationResult: EvaluationResult = JSON.parse(jsonMatch[0])
      setEvaluationResult(evaluationResult)
      
      // Agregar al historial
      setPracticeHistory(prev => [{
        question: currentQuestion,
        answer: userAnswer,
        result: evaluationResult
      }, ...prev])
      
    } catch (error) {
      console.error('Error:', error)
      setError('Error al evaluar respuesta. Verifica tu API Key y conexión.')
    } finally {
      setIsEvaluating(false)
    }
  }, [apiKey, isApiKeyValid, userAnswer, generatedQuestions, currentQuestionIndex])

  // Función para copiar al portapapeles
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }, [])

  // Función para navegar entre preguntas
  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index)
    setUserAnswer('')
    setEvaluationResult(null)
  }, [])

  const currentQuestion = generatedQuestions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="w-full max-w-full px-2 md:px-8 py-4 mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Playground de Práctica</h1>
                <p className="text-sm text-muted-foreground">Genera preguntas y practica con IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Indicador de API Key */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isApiKeyValid ? "default" : "outline"}
                      onClick={() => setShowApiKeyDialog(true)}
                      className={cn(
                        "h-9 px-3 text-sm font-medium",
                        isApiKeyValid 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "border-destructive/50 text-destructive hover:bg-destructive/10"
                      )}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {isApiKeyValid ? 'API Key Válida' : 'Configurar API Key'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isApiKeyValid ? 'API Key configurada correctamente' : 'Configura tu API Key de Gemini'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-full px-2 md:px-8 py-4 mx-auto">
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'generator'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-4 w-4 mr-2" />
            Generador
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'practice'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            disabled={generatedQuestions.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Práctica ({generatedQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'history'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Historial ({practiceHistory.length})
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 w-full max-w-full px-2 md:px-8 pb-8 mx-auto">
        {/* Tab Generador */}
        {activeTab === 'generator' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel de Configuración */}
            <div className="w-full lg:w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Configuración del Generador
                  </CardTitle>
                  <CardDescription>
                    Configura los parámetros para generar preguntas personalizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tema */}
                  <div className="space-y-2">
                    <Label htmlFor="topic">Tema o Materia</Label>
                    <Input
                      id="topic"
                      placeholder="Ej: Programación en JavaScript, Historia de México, Matemáticas..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  {/* Tipo de pregunta */}
                  <div className="space-y-2">
                    <Label>Tipo de Pregunta</Label>
                    <Select value={questionType} onValueChange={(value: QuestionType) => setQuestionType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => {
                          const Icon = type.icon
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lenguaje de programación (solo para código) */}
                  {questionType === 'code' && (
                    <div className="space-y-2">
                      <Label>Lenguaje de Programación</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMMING_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Dificultad */}
                  <div className="space-y-2">
                    <Label>Nivel de Dificultad</Label>
                    <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${level.color.split(' ')[0]}`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cantidad de preguntas */}
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Cantidad de Preguntas</Label>
                    <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} pregunta{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instrucciones personalizadas */}
                  <div className="space-y-2">
                    <Label htmlFor="customInstructions">Instrucciones Adicionales (Opcional)</Label>
                    <Textarea
                      id="customInstructions"
                      placeholder="Ej: Enfócate en conceptos básicos, incluye ejemplos prácticos..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Botón generar */}
                  <Button
                    onClick={generateQuestions}
                    disabled={!isApiKeyValid || !topic.trim() || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar Preguntas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Panel de Información */}
            <div className="w-full lg:w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Información y Consejos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">🎯 Tipos de Preguntas Disponibles:</h4>
                    <div className="space-y-2 text-sm">
                      {QUESTION_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <div key={type.value} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{type.label}:</span>
                            <span className="text-muted-foreground">
                              {type.value === 'text' && 'Preguntas abiertas que requieren respuestas detalladas'}
                              {type.value === 'code' && 'Ejercicios de programación y análisis de código'}
                              {type.value === 'multiple-choice' && 'Preguntas con múltiples opciones'}
                              {type.value === 'true-false' && 'Preguntas de verdadero o falso'}
                              {type.value === 'short-answer' && 'Respuestas cortas y concisas'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">💡 Consejos para Mejores Resultados:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Sé específico con el tema (ej: &quot;Funciones en JavaScript&quot; vs &quot;Programación&quot;)</li>
                      <li>• Usa las instrucciones adicionales para personalizar el enfoque</li>
                      <li>• Comienza con dificultad fácil y ve aumentando gradualmente</li>
                      <li>• Para código, especifica el lenguaje y nivel de experiencia</li>
                      <li>• Revisa el historial para identificar áreas de mejora</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">🔑 Configuración de API Key:</h4>
                    <p className="text-sm text-muted-foreground">
                      Necesitas una API Key válida de Google Gemini para usar esta herramienta. 
                      La key se almacena localmente en tu navegador y no se envía a nuestros servidores.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKeyDialog(true)}
                      className="w-full"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {isApiKeyValid ? 'Cambiar API Key' : 'Configurar API Key'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab Práctica */}
        {activeTab === 'practice' && (
          <div>
            {generatedQuestions.length === 0 ? (
              <div className="border rounded-lg p-8 bg-background/80 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay preguntas generadas</h3>
                <p className="text-muted-foreground mb-4">
                  Genera preguntas usando el generador para comenzar a practicar
                </p>
                <Button onClick={() => setActiveTab('generator')}>
                  Ir al Generador
                </Button>
              </div>
            ) : (
              <div>
                {/* Header de práctica */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Modo Práctica</h2>
                    <p className="text-muted-foreground">
                      Pregunta {currentQuestionIndex + 1} de {generatedQuestions.length}
                    </p>
                  </div>
                  

                </div>

                {/* Contenido de práctica - Vista de columnas */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
                  {/* Columna izquierda: Pregunta */}
                  <Card className="flex flex-col overflow-hidden mb-2 lg:mb-0 flex-1">
                    <CardHeader className="py-3 px-4 flex-shrink-0">
                      <CardTitle className="flex justify-between items-center text-base">
                        <span>Pregunta {currentQuestionIndex + 1}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={DIFFICULTY_LEVELS.find(d => d.value === currentQuestion.difficulty)?.color}>
                            {DIFFICULTY_LEVELS.find(d => d.value === currentQuestion.difficulty)?.label}
                          </Badge>
                          <Badge variant="outline">
                            {QUESTION_TYPES.find(t => t.value === currentQuestion.type)?.label}
                          </Badge>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Tema: {currentQuestion.topic}
                        {currentQuestion.language && ` • ${PROGRAMMING_LANGUAGES.find(l => l.value === currentQuestion.language)?.label}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2 px-4 pb-4 overflow-auto relative">
                      <MarkdownViewer content={currentQuestion.question} />
                      {currentQuestion.options && (
                        <div className="mt-4 space-y-2 relative z-10">
                          {currentQuestion.options.map((option, index) => (
                            <div key={index} className="p-2 bg-muted/50 rounded border">
                              {String.fromCharCode(65 + index)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Columna derecha: Respuesta */}
                  <Card className="flex flex-col overflow-hidden flex-1">
                    <CardHeader className="py-3 px-4 flex-shrink-0">
                      <CardTitle className="flex justify-between items-center text-base">
                        <span>Tu Respuesta</span>
                        <Button
                          size="sm"
                          onClick={evaluateAnswer}
                          disabled={!userAnswer.trim() || isEvaluating}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Evaluando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Evaluar
                            </>
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2 px-4 pb-4 overflow-hidden">
                      {currentQuestion.type === 'code' ? (
                        <div className="h-full" style={{ minHeight: '200px' }}>
                          <CodeEditor
                            value={userAnswer}
                            onChange={(value) => setUserAnswer(value)}
                            language={currentQuestion.language || 'javascript'}
                            height="100%"
                          />
                        </div>
                      ) : (
                        <Textarea
                          placeholder="Escribe tu respuesta aquí..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full h-full resize-none"
                          style={{ minHeight: '200px' }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Resultado de evaluación */}
                {evaluationResult && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {evaluationResult.grade >= 4 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : evaluationResult.grade >= 3 ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        Resultado de la Evaluación
                        <Badge className={`ml-2 ${
                          evaluationResult.grade >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          evaluationResult.grade >= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {evaluationResult.grade.toFixed(1)}/5.0 ({evaluationResult.score}%)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Retroalimentación:</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{evaluationResult.feedback}</p>
                      </div>
                      
                      {evaluationResult.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Sugerencias de Mejora:</h4>
                          <ul className="space-y-1">
                            {evaluationResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-muted-foreground flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Navegación entre preguntas */}
                <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-lg">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {generatedQuestions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => navigateToQuestion(index)}
                        className={cn(
                          "w-8 h-8 rounded-full text-sm font-medium transition-colors",
                          index === currentQuestionIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === generatedQuestions.length - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Historial */}
        {activeTab === 'history' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold">Historial de Práctica</h2>
              {practiceHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPracticeHistory([])}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Historial
                </Button>
              )}
            </div>

            {practiceHistory.length === 0 ? (
              <div className="border rounded-lg p-8 bg-background/80 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay historial de práctica</h3>
                <p className="text-muted-foreground mb-4">
                  Completa algunas evaluaciones para ver tu progreso aquí
                </p>
                <Button onClick={() => setActiveTab('practice')}>
                  Ir a Práctica
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {practiceHistory.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-background/80">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Pregunta sobre {entry.question.topic}</h3>
                          <Badge className={DIFFICULTY_LEVELS.find(d => d.value === entry.question.difficulty)?.color}>
                            {DIFFICULTY_LEVELS.find(d => d.value === entry.question.difficulty)?.label}
                          </Badge>
                          <Badge variant="outline">
                            {QUESTION_TYPES.find(t => t.value === entry.question.type)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.question.createdAt.toLocaleDateString()} • 
                          Calificación: {entry.result.grade.toFixed(1)}/5.0 ({entry.result.score}%)
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          entry.result.grade >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          entry.result.grade >= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {entry.result.grade >= 4 ? 'Excelente' : entry.result.grade >= 3 ? 'Bueno' : 'Necesita Mejora'}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(entry.question.question, `q-${index}`)}
                        >
                          {copiedId === `q-${index}` ? (
                            'Copiado!'
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Pregunta
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Pregunta:</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded border whitespace-pre-wrap">
                          {entry.question.question}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tu Respuesta:</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded border whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Retroalimentación:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {entry.result.feedback}
                        </p>
                      </div>
                      
                      {entry.result.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Sugerencias:</h4>
                          <ul className="space-y-1">
                            {entry.result.suggestions.map((suggestion, suggestionIndex) => (
                              <li key={suggestionIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-destructive-foreground hover:bg-destructive/80 ml-2"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Dialog para configurar API Key */}
      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configurar API Key de Gemini</AlertDialogTitle>
            <AlertDialogDescription>
              Ingresa tu API Key de Google Gemini para usar esta herramienta. 
              La key se almacena localmente en tu navegador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apikey">API Key</Label>
              <Input
                id="apikey"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Para obtener una API Key:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Ve a <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></li>
                <li>Crea una nueva API Key</li>
                <li>Copia y pega la key aquí</li>
              </ol>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const isValid = await validateApiKey(apiKey)
                if (isValid) {
                  localStorage.setItem('gemini-api-key', apiKey)
                  setShowApiKeyDialog(false)
                }
              }}
              disabled={!apiKey.trim()}
            >
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}