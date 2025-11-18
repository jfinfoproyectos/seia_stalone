'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toUTC, isBeforeUTC, isAfterUTC } from '@/lib/date-utils'
import { LANGUAGE_OPTIONS } from '@/lib/constants/languages'


import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

import { AlertCircle, CheckCircle, Clock, HelpCircle, Loader2, Send, Sparkles, XCircle, PenTool, MessageSquare, Maximize2, Minimize2, Eye } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ThemeToggle from '@/components/theme/ThemeToggle'
import ThemePaletteDots from '@/components/theme/ThemePaletteDots'
import { cn } from '@/lib/utils'

// Servicios para evaluar con Gemini AI
import { getAIFeedback } from '@/lib/gemini-code-evaluation';
import { evaluateTextResponse } from '@/lib/gemini-text-evaluation';
import { getApiKeyFromStorage } from '@/lib/apiKeyService';

// Tipos para los modelos de datos
type Question = {
  id: number
  text: string
  type: string
  language?: string | null
  answer?: string | null
  helpUrl?: string | null
}

type Answer = {
  questionId: number
  answer: string
  score?: number | null
  evaluated: boolean
}

type EvaluationData = {
  id: number
  title: string
  description?: string
  helpUrl?: string
  questions: Question[]
  startTime: Date
  endTime: Date
}

// Los datos de evaluación ahora se cargan desde la base de datos

import { submitEvaluation } from './actions';

import { useEvaluationTimer } from '../hooks/useEvaluationTimer';
import { useQuestionNavigation } from '../hooks/useQuestionNavigation';
import { useStudentData } from '../hooks/useStudentData';
import { useThemeManagement } from '../hooks/useThemeManagement';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useFocusRedirect } from '../hooks/useFocusRedirect';
import { useTabSwitchCounter } from '../hooks/useTabSwitchCounter';

import { useDevToolsDetector } from '../hooks/useDevToolsDetector';
import { EvaluationTimer } from '../components/EvaluationTimer';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { MarkdownViewer } from './components/markdown-viewer';
import { CodeEditor } from './components/code-editor';
import { Textarea } from '@/components/ui/textarea';
// API key se configura en la página de ingreso; no se muestra botón aquí

import { PunishmentModal } from './components/PunishmentModal';


export default function StudentEvaluationPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"><Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" /><p className="text-xl text-gray-300">Cargando parámetros de la evaluación...</p></div>}>
      <EvaluationContent />
    </Suspense>
  )
}

function EvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uniqueCode = searchParams.get('code');
  
  // Usar el hook para manejar datos del estudiante
  const { email, firstName, lastName, isDataLoaded } = useStudentData();
  // La API key se obtendrá desde almacenamiento cuando se requiera

  // Estado para la evaluación y respuestas (declarado temprano para uso en callbacks)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ success: boolean; message: string; details?: string; grade?: number } | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [buttonCooldown, setButtonCooldown] = useState<number>(0);
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isEvaluationExpired, setIsEvaluationExpired] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  // Eliminado el estado del diálogo de API key; manejo centralizado en la página de ingreso
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isPunishmentModalOpen, setIsPunishmentModalOpen] = useState(false);
  const [punishmentTabSwitchCount, setPunishmentTabSwitchCount] = useState(0);
  // Variables de estado para pestañas eliminadas - solo modo columnas;
  const [lastFeedback, setLastFeedback] = useState<{[questionId: number]: {success: boolean; message: string; details?: string; grade?: number}} | null>(null);

  // Usar el hook para manejar la navegación de preguntas
  const {
    currentQuestionIndex,
    goToPreviousQuestion: navigateToPrevious,
    goToNextQuestion: navigateToNext,
    goToQuestion: navigateToQuestion
  } = useQuestionNavigation({
    totalQuestions: evaluation?.questions.length || 0,
    onQuestionChange: () => {
      setEvaluationResult(null);
    }
  });

  // Funciones de navegación que incluyen reseteo del resultado
  const goToPreviousQuestion = useCallback(() => {
    navigateToPrevious();
    setEvaluationResult(null);
  }, [navigateToPrevious]);

  const goToNextQuestion = useCallback(() => {
    navigateToNext();
    setEvaluationResult(null);
  }, [navigateToNext]);

  const goToQuestion = useCallback((index: number) => {
    navigateToQuestion(index);
    setEvaluationResult(null);
  }, [navigateToQuestion]);

  // Usar el hook para manejar el tema
  const { mounted, restoreTheme } = useThemeManagement();

  // Usar el hook para manejar la visibilidad de la página
  usePageVisibility();

  // Usar el hook para detectar pérdida de foco y redirigir
  const { disableFocusRedirect, enableFocusRedirect } = useFocusRedirect({
    enabled: false // Deshabilitado para usar solo el contador
  });

  // Usar el hook para contar cambios de pestaña y redirigir inmediatamente al primer cambio
  useTabSwitchCounter({
    enabled: true,
    onTabSwitch: (count) => {
      console.log(`[Tab Switch Counter] Cambio de pestaña detectado (total: ${count}). Redirigiendo...`);
      try {
        // Registrar motivo de redirección para avisar en la entrada del estudiante
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectReason', 'tab-switch');
        }
        // Limpiar estado de pausa y contador para evitar persistencia entre sesiones
        localStorage.removeItem('securityPauseState');
        localStorage.removeItem('tabSwitchCount');
      } catch {}
      router.push('/student');
    }
    // No proveer onPunishmentTrigger para evitar el modal de bloqueo
  });

  // Usar el hook para manejar el contador de evaluaciones


  // Detectar DevTools y redirigir si se abren
  useDevToolsDetector({
    enabled: true,
    onDevToolsOpen: () => {
      console.warn('[Security] DevTools detectadas - redirigiendo a página de entrada');
      // Limpiar datos de la sesión actual
      localStorage.removeItem('securityPauseState');
      // Redirigir a la página de entrada del estudiante
      router.push('/student');
    }
  });

  // Redirigir inmediatamente si se detecta un redimensionamiento de la ventana
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      try {
        // Redirigir a la pantalla de ingreso de código del estudiante
        router.push('/student');
      } catch (err) {
        console.error('[Security] Error al redirigir por resize:', err);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [router]);

  // Detectar estado de pausa persistente al cargar la página
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedState = localStorage.getItem('securityPauseState')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        const now = Date.now()
        const elapsed = Math.floor((now - state.startTime) / 1000)
        const remainingTime = Math.max(0, 30 - elapsed)

        if (state.isActive && remainingTime > 0) {
          // Hay una pausa activa, restaurar el modal
          setPunishmentTabSwitchCount(state.tabSwitchCount)
          setIsPunishmentModalOpen(true)
        } else if (state.isActive && remainingTime <= 0) {
          // La pausa ya expiró, limpiar estado
          localStorage.removeItem('securityPauseState')
        }
      } catch (error) {
        console.error('Error al restaurar estado de pausa:', error)
        localStorage.removeItem('securityPauseState')
      }
    }
  }, [])

  // Refs for state values needed in event handlers to avoid dependency loops
  const currentAnswerRef = useRef<Answer | null>(null);
  const saveAnswerRef = useRef<((submissionId: number, questionId: number, answerText: string, score?: number) => Promise<{ success: boolean; answer?: unknown; error?: string }>) | null>(null);



  // Hook del temporizador de evaluación
  const { timeRemaining, isTimeExpired, progressPercentage } = useEvaluationTimer({
    endTime: evaluation?.endTime || new Date(),
    startTime: evaluation?.startTime,
    onTimeExpired: () => {
      // Enviar automáticamente cuando el tiempo expire
      console.log('⏰ Tiempo expirado - Ejecutando callback');
      console.log('📊 handleSubmitEvaluationRef disponible:', !!handleSubmitEvaluationRef.current);
      if (handleSubmitEvaluationRef.current) {
        console.log('✅ Ejecutando handleSubmitEvaluation automáticamente');
        handleSubmitEvaluationRef.current();
      } else {
        console.error('❌ handleSubmitEvaluationRef.current no está disponible');
      }
    }
  });

  // Actualizar las refs cuando cambien los valores
  useEffect(() => {
    currentAnswerRef.current = answers[currentQuestionIndex];
  }, [answers, currentQuestionIndex]);

  // Cargar la función saveAnswer una sola vez
  useEffect(() => {
    const loadSaveAnswerFunction = async () => {
      try {
        const { saveAnswer } = await import('./actions');
        saveAnswerRef.current = saveAnswer;
      } catch (error) {
        console.error('Error al cargar la función saveAnswer:', error);
      }
    };

    loadSaveAnswerFunction();
  }, []);

  // Restaurar el tema seleccionado al cargar la página
  useEffect(() => {
    if (mounted) {
      restoreTheme();
    }
  }, [mounted, restoreTheme]);





  // Cargar datos de la evaluación
  useEffect(() => {
    // Esperar a que los datos del estudiante se carguen
    if (!isDataLoaded) {
      return;
    }

    // La API key guardada se usará durante la evaluación; no se elimina aquí

    if (!uniqueCode || !email || !firstName || !lastName) {
      console.error('Código de evaluación o datos del estudiante incompletos')
      router.push('/student')
      return
    }

    const loadEvaluationData = async () => {
      try {
        // Importar las acciones del servidor de forma dinámica para evitar errores de SSR
        const { getAttemptByUniqueCode, createSubmission } = await import('./actions')

        // Obtener los datos del intento por el código único y el email del estudiante
        const attemptResult = await getAttemptByUniqueCode(uniqueCode, email)

        if (!attemptResult.success) {
          // Verificar si la evaluación ya fue enviada
          if (attemptResult.alreadySubmitted) {
            // Redirigir silenciosamente a la página de éxito sin mostrar error
            router.push(`/student/success?alreadySubmitted=true&code=${uniqueCode}`)
            return
          }

          // Verificar si el error es debido a que la evaluación ha expirado
          if (attemptResult.error === 'La evaluación ya ha finalizado' ||
            attemptResult.error === 'La evaluación aún no ha comenzado') {
            setIsEvaluationExpired(true)
            setLoading(false)
            return
          }

          // Para otros errores, mostrar mensaje de error y establecer estado
          console.error(attemptResult.error)
          setErrorMessage(attemptResult.error || 'Error al cargar la evaluación')
          setLoading(false)
          return
        }

        // Verificar que attempt y evaluationData existan
        const { attempt, evaluation: evaluationData } = attemptResult

        if (!attempt || !evaluationData) {
          console.error('Datos de evaluación incompletos')
          router.push('/student')
          return
        }

        // Verificar si la evaluación está dentro del rango de tiempo permitido
        const now = toUTC(new Date())
        const startTime = toUTC(attempt.startTime)
        const endTime = toUTC(attempt.endTime)

        if (isBeforeUTC(now, startTime) || isAfterUTC(now, endTime)) {
          setIsEvaluationExpired(true)
          setLoading(false)
          return
        }

        // Crear una nueva presentación para este estudiante
        const submissionResult = await createSubmission(attempt.id, email, firstName, lastName)

        if (!submissionResult.success) {
          // Si el error es porque la evaluación ya fue enviada, redirigir a una página específica
          if (submissionResult.error && submissionResult.error.includes('ya fue enviada')) {
            router.push(`/student/success?alreadySubmitted=true&code=${uniqueCode}`)
          } else {
            console.error(submissionResult.error || 'Error al crear la presentación')
            setErrorMessage(submissionResult.error || 'Error al crear la presentación');
            setLoading(false);
          }
          return
        }

        // Verificar que submission exista
        if (!submissionResult.submission) {
          console.error('Error al crear la presentación')
          router.push('/student')
          return
        }

        // Guardar el ID de la presentación para usarlo más tarde
        const submissionId = submissionResult.submission.id
        setSubmissionId(submissionId)

        // Convertir los datos de la evaluación al formato esperado por el componente
        const formattedEvaluation: EvaluationData = {
          id: evaluationData.id,
          title: evaluationData.title,
          description: evaluationData.description || undefined,
          helpUrl: evaluationData.helpUrl || undefined,
          questions: evaluationData.questions,
          startTime: attempt.startTime,
          endTime: attempt.endTime
        }

        setEvaluation(formattedEvaluation)

        // Obtener respuestas guardadas previamente
        const { getAnswersBySubmissionId } = await import('./actions')
        const answersResult = await getAnswersBySubmissionId(submissionId)

        const questions = evaluationData.questions || []
        let initialAnswers = questions.map(question => {
          // Inicializamos todas las respuestas como cadenas vacías por defecto
          return {
            questionId: question.id,
            answer: '',
            evaluated: false,
            score: null as number | null
          }
        })

        // Si hay respuestas guardadas, las cargamos
        if (answersResult.success && answersResult.answers) {
          // Actualizar las respuestas con los datos guardados
          initialAnswers = initialAnswers.map(defaultAnswer => {
            // Buscar la respuesta guardada para esta pregunta
            const savedAnswer = answersResult.answers.find(a => a.questionId === defaultAnswer.questionId)

            if (savedAnswer) {
              return {
                ...defaultAnswer,
                answer: savedAnswer.answer || '',
                score: savedAnswer.score,
                evaluated: savedAnswer.score !== null
              }
            }
            return defaultAnswer
          })
        }

        setAnswers(initialAnswers)
      } catch (error) {
        console.error('Error al cargar los datos de la evaluación:', error)
        console.error('Error al cargar la evaluación')
        router.push('/student')
      } finally {
        setLoading(false)
      }
    }

    loadEvaluationData()
  }, [uniqueCode, email, firstName, lastName, isDataLoaded, router])

  // Función para mostrar el diálogo de confirmación de envío
  const openSubmitDialog = useCallback(() => {
    if (!evaluation || !uniqueCode || !email || !firstName || !lastName || !submissionId) return

    setIsSubmitDialogOpen(true)
  }, [evaluation, uniqueCode, email, firstName, lastName, submissionId])

  // Función para mostrar la última retroalimentación
  const showLastFeedback = useCallback(() => {
    if (!evaluation) return
    
    const currentQuestion = evaluation.questions[currentQuestionIndex]
    const feedback = lastFeedback?.[currentQuestion.id]
    
    if (feedback) {
      setEvaluationResult(feedback)
      setIsResultModalOpen(true)
    }
  }, [evaluation, currentQuestionIndex, lastFeedback])

  // Función para manejar cuando se complete la pausa de seguridad
  const handlePunishmentComplete = useCallback(() => {
    setIsPunishmentModalOpen(false);
    setPunishmentTabSwitchCount(0);
  }, []);

  // Función para alternar el modo expandido del área de respuesta
  const toggleResponseExpanded = () => {
    setIsResponseExpanded(!isResponseExpanded);
  };

  // Función para abrir/cerrar el modal de la pregunta
  const toggleQuestionModal = () => {
    setIsQuestionModalOpen(!isQuestionModalOpen);
  };



  // Enviar la evaluación completa
  const handleSubmitEvaluation = useCallback(async () => {
    console.log('🚀 handleSubmitEvaluation ejecutado');
    console.log('📋 Estado:', { evaluation: !!evaluation, submissionId });
    
    if (!evaluation || !submissionId) {
      console.log('❌ Condiciones no cumplidas para envío');
      return;
    }

    try {
      console.log('📤 Enviando evaluación...');
      const result = await submitEvaluation(submissionId);
      console.log('📥 Resultado:', result);
      
      if (result.success) {
        console.log('✅ Evaluación enviada exitosamente, redirigiendo...');
        // Redirigir a la página de reporte con los datos por query params
        router.push(`/student/report?name=${encodeURIComponent(firstName + ' ' + lastName)}&grade=${result.submission?.score ?? ''}&date=${encodeURIComponent(new Date().toLocaleString())}`)
        return;
      } else {
        console.log('❌ Error en resultado:', result.error);
        setErrorMessage(result.error || 'Error al enviar la evaluación');
      }
    } catch (error) {
      console.error('💥 Excepción al enviar la evaluación:', error);
      setErrorMessage('Error al enviar la evaluación');
    }
  }, [evaluation, submissionId, router, firstName, lastName]);

  // Referencia para la función de envío de evaluación para evitar dependencias circulares
  const handleSubmitEvaluationRef = useRef(handleSubmitEvaluation);

  // Actualizar la referencia cuando cambie la función
  useEffect(() => {
    handleSubmitEvaluationRef.current = handleSubmitEvaluation;
  }, [handleSubmitEvaluation]);



  // Manejar cambios en las respuestas
  const handleAnswerChange = (value: string) => {
    const updatedAnswers = [...answers]
    updatedAnswers[currentQuestionIndex].answer = value
    updatedAnswers[currentQuestionIndex].evaluated = false
    updatedAnswers[currentQuestionIndex].score = null
    setAnswers(updatedAnswers)
    setEvaluationResult(null)

    // NO guardar automáticamente en la base de datos al cambiar respuestas
    // Solo se guardará cuando se evalúe o se envíe la evaluación
  }

  // Evaluar la respuesta actual con Gemini
  const evaluateCurrentAnswer = async () => {
    if (!evaluation || !submissionId) return

    const storedApiKey = getApiKeyFromStorage();
    if (!storedApiKey) {
      console.error('API Key no configurada');
      setErrorMessage('API key de Gemini no configurada. Ingresa tu API key en la página de ingreso.');
      router.push('/student');
      return;
    }

    const currentQuestion = evaluation.questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestionIndex]

    if (!currentAnswer.answer.trim()) {
      console.warn('Por favor, proporciona una respuesta antes de evaluar')
      return
    }

    // Verificar si el botón está en enfriamiento
    if (buttonCooldown > 0) {
      return
    }

    setEvaluating(true)

    try {
      if (currentQuestion.type && currentQuestion.type.toLowerCase() === 'code') {
        const language = currentQuestion.language || 'javascript'

        const result = await getAIFeedback(
          currentAnswer.answer,
          currentQuestion.text,
          language,
          storedApiKey
        )

        // Contador de evaluaciones retirado

        // Actualizar el estado de la respuesta
        const updatedAnswers = [...answers]
        updatedAnswers[currentQuestionIndex].evaluated = true
        updatedAnswers[currentQuestionIndex].score = result.grade
        setAnswers(updatedAnswers)

        // Guardar la respuesta evaluada en la base de datos
        let saveResult
        if (saveAnswerRef.current) {
          saveResult = await saveAnswerRef.current(
            submissionId,
            currentAnswer.questionId,
            currentAnswer.answer,
            result.grade !== undefined ? result.grade : undefined
          )
        } else {
          const { saveAnswer } = await import('./actions')
          saveResult = await saveAnswer(
            submissionId,
            currentAnswer.questionId,
            currentAnswer.answer,
            result.grade !== undefined ? result.grade : undefined
          )
        }

        if (!saveResult.success) {
          console.error('Error al guardar la respuesta evaluada:', saveResult.error)
        }

        // Mostrar resultado de la evaluación
        const newResult = {
          success: result.isCorrect,
          message: currentAnswer.evaluated ? 'Respuesta reevaluada' : (result.isCorrect ? '¡Respuesta correcta!' : 'La respuesta necesita mejoras'),
          details: result.feedback,
          grade: result.grade
        }
        
        // Guardar la retroalimentación para esta pregunta
        setLastFeedback(prev => ({
          ...prev,
          [currentQuestion.id]: newResult
        }))
        
        setEvaluationResult(newResult)
        setIsResultModalOpen(true)
      } else {
        // Para preguntas de texto, evaluamos con IA usando la función específica para texto
        const result = await evaluateTextResponse(
          currentAnswer.answer,
          currentQuestion.text,
          storedApiKey
        )

        // Contador de evaluaciones retirado

        // Actualizar el estado de la respuesta
        const updatedAnswers = [...answers]
        updatedAnswers[currentQuestionIndex].evaluated = true
        updatedAnswers[currentQuestionIndex].score = result.grade
        setAnswers(updatedAnswers)

        // Guardar la respuesta evaluada en la base de datos
        let saveResult
        if (saveAnswerRef.current) {
          saveResult = await saveAnswerRef.current(
            submissionId,
            currentAnswer.questionId,
            currentAnswer.answer,
            result.grade !== undefined ? result.grade : undefined
          )
        } else {
          const { saveAnswer } = await import('./actions')
          saveResult = await saveAnswer(
            submissionId,
            currentAnswer.questionId,
            currentAnswer.answer,
            result.grade !== undefined ? result.grade : undefined
          )
        }

        if (!saveResult.success) {
          console.error('Error al guardar la respuesta evaluada:', saveResult.error)
        }

        const newResult = {
          success: result.isCorrect,
          message: currentAnswer.evaluated ? 'Respuesta reevaluada' : (result.isCorrect ? '¡Respuesta aceptable!' : 'La respuesta necesita mejoras'),
          details: result.feedback,
          grade: result.grade
        }
        
        // Guardar la retroalimentación para esta pregunta
        setLastFeedback(prev => ({
          ...prev,
          [currentQuestion.id]: newResult
        }))
        
        setEvaluationResult(newResult)
        setIsResultModalOpen(true)
      }

      // Iniciar el temporizador de enfriamiento (60 segundos)
      setButtonCooldown(15)
      const cooldownTimer = setInterval(() => {
        setButtonCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownTimer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (error) {
      console.error('Error al evaluar la respuesta:', error)
      console.error('Error al evaluar la respuesta. Por favor, intenta de nuevo.')
    } finally {
      setEvaluating(false)
    }
  }

  // Obtener el color del círculo según el estado de la respuesta
  const getQuestionStatusColor = (index: number) => {
    const answer = answers[index]

    if (!answer || !answer.answer.trim()) {
      return {
        bgColor: 'bg-muted border border-muted-foreground/30',
        tooltip: 'Sin responder',
        score: null
      }
    }

    if (!answer.evaluated) {
      return {
        bgColor: 'bg-amber-400 dark:bg-amber-600 border border-amber-500/50 dark:border-amber-700/50 animate-pulse',
        tooltip: 'Respondida pero no evaluada',
        score: null
      }
    }

    // Usar los mismos rangos y colores que en las alertas de respuestas
    if (answer.score !== null && answer.score !== undefined) {
      if (answer.score >= 4 && answer.score <= 5) {
        return {
          bgColor: 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-600/50 dark:border-emerald-700/50',
          tooltip: 'Correcta',
          score: answer.score
        }
      } else if (answer.score >= 3 && answer.score < 4) {
        return {
          bgColor: 'bg-amber-500 dark:bg-amber-600 border border-amber-600/50 dark:border-amber-700/50',
          tooltip: 'Aceptable',
          score: answer.score
        }
      } else {
        return {
          bgColor: 'bg-red-500 dark:bg-red-600 border border-red-600/50 dark:border-red-700/50',
          tooltip: 'Necesita mejoras',
          score: answer.score
        }
      }
    }

    return {
      bgColor: 'bg-rose-500 dark:bg-rose-600 border border-rose-600/50 dark:border-rose-700/50',
      tooltip: 'Necesita mejoras',
      score: null
    }
  }

  // Renderizar pantalla de evaluación expirada
  const renderExpiredEvaluation = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center text-red-600 dark:text-red-500">
              Evaluación no disponible
            </CardTitle>
            <CardDescription className="text-center">
              Esta evaluación ya no está disponible porque la fecha y hora límite ha expirado o aún no ha comenzado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Clock className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-center mb-6">
              Por favor, contacta con tu profesor si necesitas acceso a esta evaluación.
            </p>
            <Button
              onClick={() => router.push('/student')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Volver a ingresar código
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Función para cerrar el modal de ayuda
  const handleCloseHelpModal = useCallback((open: boolean) => {
    setIsHelpMode(open);
  }, []);

  // Efecto para cerrar el Sheet cuando el usuario cambia de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isHelpMode) {
        handleCloseHelpModal(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHelpMode, handleCloseHelpModal]);

  // Efecto para manejar la habilitación/deshabilitación del hook de foco según el modo ayuda
  useEffect(() => {
    if (isHelpMode) {
      // Deshabilitar detección de pérdida de foco cuando está en modo ayuda
      disableFocusRedirect();
    } else {
      // Habilitar detección de pérdida de foco cuando sale del modo ayuda
      enableFocusRedirect();
    }
  }, [isHelpMode, disableFocusRedirect, enableFocusRedirect]);

  // Efecto para detectar cuando la página está oculta
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Renderizado principal

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (isEvaluationExpired) {
    return renderExpiredEvaluation();
  }

  // Mostrar mensaje de error si hay un problema con la evaluación
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center text-red-600 dark:text-red-500">
              Prueba no disponible
            </CardTitle>
            <CardDescription className="text-center">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-center mb-6">
              Por favor, verifica el código de evaluación o contacta con tu profesor si necesitas acceso a esta evaluación.
            </p>
            <Button
              onClick={() => router.push('/student')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Volver a ingresar código
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">No se pudo cargar la evaluación. Por favor, verifica el código e intenta de nuevo.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/student')}>Volver</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentQuestion = evaluation.questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex]

  // Determinar el lenguaje de programación para preguntas de código
  let language = 'javascript'
  if (currentQuestion && currentQuestion.type && currentQuestion.type.toLowerCase() === 'code') {
    // Obtener el lenguaje directamente del campo language de la pregunta
    language = currentQuestion.language || 'javascript'
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden" style={{ zIndex: 1, position: 'relative' }}>
           
      {/* Barra superior con información y controles - Mejorada distribución y responsividad */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-2 bg-card shadow-md flex-shrink-0 border-b gap-2 min-h-[3rem]">
        
        {/* SECCIÓN IZQUIERDA: Información de la evaluación */}
        <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto lg:flex-1 lg:max-w-md">
          <div className="hidden sm:block h-5 border-l border-border/50"></div>
          <div className="overflow-hidden flex-grow min-w-0">
            <h1 className={`text-sm sm:text-base lg:text-lg font-bold truncate transition-all duration-300 ${isPageHidden ? 'animate-pulse text-red-500 dark:text-red-400' : ''}`}>
              {isPageHidden ? '⚠️ ' : ''}{evaluation.title}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{firstName} {lastName}</p>
          </div>
        </div>

        {/* SECCIÓN CENTRAL: Indicadores de progreso */}
        <div className="flex flex-wrap sm:flex-nowrap lg:flex-nowrap items-center justify-center gap-1 sm:gap-2 w-full lg:w-auto lg:flex-1 lg:max-w-lg">
          {/* Calificación calculada */}
          {answers.some(a => a.evaluated) && (
            <div className="flex items-center gap-1 h-7 bg-primary/10 px-1 sm:px-2 rounded-md min-w-0">
              <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="font-semibold text-xs truncate">
                <span className="hidden sm:inline">Calificación: </span>
                <span className="sm:hidden">Cal: </span>
                {(answers.reduce((sum, a) => sum + (a.score || 0), 0) / evaluation.questions.length).toFixed(1)}/5.0
              </span>
            </div>
          )}

          {/* Indicador de progreso */}
          <div className="flex items-center gap-1 h-7 bg-primary/10 px-1 sm:px-2 rounded-md min-w-0 flex-shrink">
            <ProgressIndicator answers={answers} />
            <div className="flex flex-col w-full min-w-0">
              <div className="w-full sm:w-16 lg:w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.round((answers.filter(a => a.answer.trim().length > 0).length / answers.length) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Temporizador */}
          <div className="flex-shrink-0">
            <EvaluationTimer
              timeRemaining={timeRemaining}
              isTimeExpired={isTimeExpired}
              progressPercentage={progressPercentage}
              variant="default"
              showProgressBar={true}
            />
          </div>
        </div>

        {/* SECCIÓN DERECHA: Botones de acción con ayuda al final */}
        <div className="flex items-center gap-1 sm:gap-2 w-full lg:w-auto lg:flex-1 lg:max-w-md justify-between lg:justify-end">
          
          {/* Grupo de botones principales */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* Botón de enviar evaluación */}
            <Button
              size="sm"
              onClick={openSubmitDialog}
              disabled={loading}
              className="gap-1 h-7 text-xs"
            >
              <Send className="h-3 w-3" />
              <span className="hidden xs:inline sm:hidden lg:inline">{loading ? 'Enviando...' : 'Enviar'}</span>
              <span className="xs:hidden sm:inline lg:hidden">{loading ? '...' : 'Env'}</span>
            </Button>
            
            {/* Pantalla completa eliminada */}
            
            {/* Configuración de API key removida de la evaluación */}
            
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <ThemeToggle className="flex-shrink-0" />
                    <div className="hidden sm:flex">
                      <ThemePaletteDots />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Cambiar tema y paleta</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Separador y botón de ayuda al final */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden lg:block h-5 border-l border-border/50"></div>
            
            {/* Botón de ayuda - SIEMPRE AL FINAL */}
            {(evaluation?.helpUrl || currentQuestion.helpUrl) && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsHelpMode(!isHelpMode)}
                className={cn(
                  "h-7 px-1 sm:px-2 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0",
                  isHelpMode 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" 
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                )}
                title={isHelpMode ? "Volver a la evaluación" : "Ver recursos de ayuda"}
              >
                {isHelpMode ? (
                  <PenTool className="h-3 w-3" />
                ) : (
                  <HelpCircle className="h-3 w-3" />
                )}
                <span className="hidden sm:inline ml-1">
                  {isHelpMode ? 'Evaluación' : 'Ayuda'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* El resultado de la evaluación ahora se muestra en un modal */}

      {/* Contenido principal - Diseño tipo landing page en móviles */}
      {isHelpMode ? (
        // Modo Ayuda - Ocupa todo el espacio sin encabezado
        <div className="flex-grow">
          {/* Contenido de ayuda sin Card wrapper */}
          <div className="w-full h-full">
              {evaluation?.helpUrl ? (
                <iframe
                  src={evaluation.helpUrl}
                  className="w-full h-full border-0"
                  title="Recursos de ayuda"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <HelpCircle className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No hay recursos de ayuda configurados
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    El profesor no ha configurado recursos de ayuda para esta evaluación. 
                    Puedes continuar respondiendo las preguntas con tus conocimientos.
                  </p>
                </div>
              )}
           </div>
        </div>
      ) : (
        // Modo Normal - Dos columnas: pregunta y respuesta (o solo respuesta si está expandida)
        <div className={`flex flex-col gap-4 p-4 flex-1 overflow-hidden ${isResponseExpanded ? '' : 'lg:grid lg:grid-cols-2'}`}>
          {/* Columna izquierda: Visualizador de Markdown - Oculta cuando está expandida */}
          {!isResponseExpanded && (
            <Card className="flex flex-col overflow-hidden mb-2 lg:mb-0 flex-1">
              <CardHeader className="py-2 px-4 flex-shrink-0">
                <CardTitle className="flex justify-between items-center text-base">
                  <span>Pregunta {currentQuestionIndex + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? 'Código' : 'Texto'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-2 px-4 pb-4 overflow-auto relative">
                <MarkdownViewer 
                  content={currentQuestion.text} 
                />
              </CardContent>
            </Card>
          )}

          {/* Columna derecha: Editor de respuesta - Ocupa todo el ancho cuando está expandida */}
          <Card className="flex flex-col overflow-hidden flex-1">
            <CardHeader className="py-2 px-4 flex-shrink-0">
              <CardTitle className="flex flex-wrap sm:flex-nowrap justify-between items-center text-base gap-1 sm:gap-0">
                <span>Tu Respuesta</span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 truncate max-w-[100px] sm:max-w-none">
                      {LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || language}
                    </span>
                  )}
                  
                  {/* Botón para ver pregunta cuando está expandida */}
                  {isResponseExpanded && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={toggleQuestionModal}
                            className="h-7 text-xs px-2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Ver pregunta
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Botón para expandir/colapsar área de respuesta */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleResponseExpanded}
                          className="h-7 text-xs px-2"
                        >
                          {isResponseExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isResponseExpanded ? 'Mostrar pregunta' : 'Expandir respuesta'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Botón para ver última retroalimentación */}
                  {lastFeedback?.[currentQuestion.id] && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={showLastFeedback}
                            className="h-7 text-xs px-2"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Ver última retroalimentación
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <Button
                    size="sm"
                    variant="default"
                    onClick={evaluateCurrentAnswer}
                    disabled={evaluating || !currentAnswer.answer.trim()}
                    className="h-7 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md hover:shadow-lg px-3"
                  >
                    {evaluating ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="hidden xs:inline">Evaluando...</span>
                        <span className="xs:hidden">...</span>
                      </span>
                    ) : buttonCooldown > 0 ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="hidden xs:inline">{currentAnswer.evaluated ? "Reevaluar" : "Evaluar"} ({buttonCooldown}s)</span>
                        <span className="xs:hidden">({buttonCooldown}s)</span>
                      </span>
                    ) : currentAnswer.evaluated ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span className="hidden xs:inline">Reevaluar con IA</span>
                        <span className="xs:hidden">Reevaluar</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span className="hidden xs:inline">Evaluar con IA</span>
                        <span className="xs:hidden">Evaluar</span>
                      </span>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-2 px-4 pb-0 overflow-hidden relative">
              {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? (
                <CodeEditor
                    value={currentAnswer.answer}
                  onChange={handleAnswerChange}
                  language={language}
                />
              ) : (
                <div className="absolute inset-0 mx-3 sm:mx-4">
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={currentAnswer.answer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-full h-full resize-none rounded-lg"
                    style={{
                      fontSize: '1.2rem',
                      padding: '1rem',
                      lineHeight: '1.6',
                      overflowY: 'auto'
                    }}
                    spellCheck={true}
                    // Deshabilitar pegar estrictamente
                    onPaste={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onKeyDown={(e) => {
                      // Bloquear Ctrl+V, Ctrl+Shift+V, Shift+Insert
                      if ((e.ctrlKey && e.key === 'v') || 
                          (e.ctrlKey && e.shiftKey && e.key === 'V') ||
                          (e.shiftKey && e.key === 'Insert')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer con controles de paginación - Solo visible en modo normal */}
      {!isHelpMode && (
        <QuestionNavigator
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={evaluation.questions.length}
          onNavigateToQuestion={goToQuestion}
          onNavigateToPrevious={goToPreviousQuestion}
          onNavigateToNext={goToNextQuestion}
          getQuestionStatusColor={getQuestionStatusColor}
        />
      )}

      {/* Modal de confirmación para enviar evaluación */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío de evaluación</AlertDialogTitle>
            <AlertDialogDescription>
              {answers.filter(a => !a.answer.trim()).length > 0 ? (
                <>
                  <p className="mb-2">Tienes <span className="font-bold text-destructive">{answers.filter(a => !a.answer.trim()).length} pregunta(s) sin responder</span>.</p>
                  <p>Una vez enviada la evaluación, no podrás modificar tus respuestas. ¿Estás seguro de que deseas enviar la evaluación?</p>
                </>
              ) : (
                <p>Una vez enviada la evaluación, no podrás modificar tus respuestas. ¿Estás seguro de que deseas enviar la evaluación?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitEvaluation} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar evaluación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal rediseñado para mostrar el resultado de la evaluación */}
      {evaluationResult && isResultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setIsResultModalOpen(false)}
          />
          
          {/* Contenedor principal flotante - Más ancho que alto */}
          <div className="relative w-full max-w-6xl max-h-[85vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de resultado con animación */}
                  <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    evaluationResult.grade !== undefined ? (
                      evaluationResult.grade >= 4 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                      evaluationResult.grade >= 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-red-500 to-rose-600'
                    ) : (
                      evaluationResult.success ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                      'bg-gradient-to-br from-amber-500 to-orange-600'
                    )
                  }`}>
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    {evaluationResult.grade !== undefined ? (
                      evaluationResult.grade >= 4 ? (
                        <CheckCircle className="h-8 w-8 text-white" />
                      ) : evaluationResult.grade >= 3 ? (
                        <AlertCircle className="h-8 w-8 text-white" />
                      ) : (
                        <XCircle className="h-8 w-8 text-white" />
                      )
                    ) : (
                      evaluationResult.success ? (
                        <CheckCircle className="h-8 w-8 text-white" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-white" />
                      )
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Resultado de la Evaluación
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        evaluationResult.grade !== undefined ? (
                          evaluationResult.grade >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          evaluationResult.grade >= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        ) : (
                          evaluationResult.success ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        )
                      }`}>
                        {evaluationResult.grade !== undefined ? 'Calificado' : 'Evaluado'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {evaluationResult.message}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setIsResultModalOpen(false)}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar resultado"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal con layout horizontal */}
            <div className="flex flex-col lg:flex-row gap-6 p-6 max-h-[65vh] overflow-hidden">
              {/* Panel izquierdo: Nota destacada */}
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="relative">
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl" />
                  
                  {/* Contenedor de la nota */}
                  <div className={`relative bg-gradient-to-br backdrop-blur-sm border rounded-2xl p-8 text-center shadow-lg ${
                    evaluationResult.grade !== undefined ? (
                      evaluationResult.grade >= 4 ? 'from-emerald-50/80 via-green-50/60 to-emerald-100/40 border-emerald-200/50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-900/20 dark:border-emerald-800/30' :
                      evaluationResult.grade >= 3 ? 'from-amber-50/80 via-orange-50/60 to-amber-100/40 border-amber-200/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/20 dark:border-amber-800/30' :
                      'from-red-50/80 via-rose-50/60 to-red-100/40 border-red-200/50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-red-900/20 dark:border-red-800/30'
                    ) : 'from-blue-50/80 via-indigo-50/60 to-blue-100/40 border-blue-200/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-900/20 dark:border-blue-800/30'
                  }`}>
                    {evaluationResult.grade !== undefined ? (
                      <>
                        <div className="mb-4">
                          <div className={`text-6xl font-black mb-2 ${
                            evaluationResult.grade >= 4 ? 'text-emerald-600 dark:text-emerald-400' :
                            evaluationResult.grade >= 3 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {evaluationResult.grade.toFixed(1)}
                          </div>
                          <div className="text-2xl font-semibold text-muted-foreground">
                            / 5.0
                          </div>
                        </div>
                        
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                          evaluationResult.grade >= 4 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                          evaluationResult.grade >= 3 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                          'bg-red-500/20 text-red-700 dark:text-red-300'
                        }`}>
                          {evaluationResult.grade >= 4 ? (
                            <>
                              <Sparkles className="h-4 w-4" />
                              ¡Excelente!
                            </>
                          ) : evaluationResult.grade >= 3 ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Bien hecho
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              Puede mejorar
                            </>
                          )}
                        </div>
                        
                        {/* Barra de progreso visual */}
                        <div className="mt-6">
                          <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                evaluationResult.grade >= 4 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                                evaluationResult.grade >= 3 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                                'bg-gradient-to-r from-red-500 to-rose-600'
                              }`}
                              style={{ width: `${(evaluationResult.grade / 5) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>0</span>
                            <span>2.5</span>
                            <span>5.0</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          evaluationResult.success ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        }`}>
                          {evaluationResult.success ? (
                            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="text-xl font-semibold">
                          {evaluationResult.success ? 'Respuesta Correcta' : 'Respuesta Evaluada'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Panel derecho: Retroalimentación */}
              <div className="lg:w-2/3 flex-1 min-w-0">
                <div className="relative h-full">
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
                  
                  {/* Contenedor de retroalimentación */}
                  <div className="relative bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 border border-border/30 rounded-2xl backdrop-blur-sm flex flex-col h-full">
                    {/* Header fijo */}
                    <div className="flex items-center gap-3 p-6 pb-4 flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Retroalimentación Detallada</h3>
                    </div>
                    
                    {/* Contenido con scroll */}
                    <div className="flex-1 px-6 pb-6 min-h-0">
                      {evaluationResult.details ? (
                        <div className="h-full overflow-y-auto overflow-x-hidden pr-2 -mr-2">
                          {/* Scrollbar personalizada */}
                          <style jsx>{`
                            div::-webkit-scrollbar {
                              width: 8px;
                            }
                            div::-webkit-scrollbar-track {
                              background: transparent;
                              border-radius: 4px;
                            }
                            div::-webkit-scrollbar-thumb {
                              background: hsl(var(--muted-foreground) / 0.3);
                              border-radius: 4px;
                              border: 2px solid transparent;
                              background-clip: content-box;
                            }
                            div::-webkit-scrollbar-thumb:hover {
                              background: hsl(var(--muted-foreground) / 0.5);
                              background-clip: content-box;
                            }
                          `}</style>
                          
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground break-words">
                              {evaluationResult.details}
                            </div>
                          </div>
                          
                          {/* Indicador de scroll si el contenido es largo */}
                          {evaluationResult.details.length > 500 && (
                            <div className="mt-4 pt-4 border-t border-border/20 text-center">
                              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                                Desplázate para ver más contenido
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No hay retroalimentación adicional disponible</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barra inferior con acciones */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Evaluación completada
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsResultModalOpen(false)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal mejorado para mostrar la pregunta en modo expandido */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setIsQuestionModalOpen(false)}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de tipo con animación */}
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gradient-to-br from-green-500 to-teal-600'
                  } shadow-lg`}>
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Pregunta {currentQuestionIndex + 1}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        currentQuestion.type && currentQuestion.type.toLowerCase() === 'code'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? 'Código' : 'Texto'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {currentQuestionIndex + 1} de {evaluation.questions.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar vista previa"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal con scroll personalizado */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="relative">
                {/* Decoración de fondo */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
                
                {/* Contenedor del contenido */}
                <div className="relative bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 border border-border/30 rounded-xl p-8 min-h-[300px] backdrop-blur-sm">
                  <MarkdownViewer content={currentQuestion.text} />
                </div>
              </div>
            </div>
            
            {/* Barra inferior con información */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Pregunta ID: {currentQuestion.id}
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="text-sm text-muted-foreground">
                  Tipo: {currentQuestion.type && currentQuestion.type.toLowerCase() === 'code' ? 'Código' : 'Texto'}
                </div>
                {currentQuestion.language && (
                  <>
                    <div className="w-px h-4 bg-border" />
                    <div className="text-sm text-muted-foreground">
                      Lenguaje: {currentQuestion.language}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  answers.find(a => a.questionId === currentQuestion.id)?.answer.trim() ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium">
                  {answers.find(a => a.questionId === currentQuestion.id)?.answer.trim() ? 'Respondida' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pausa de seguridad por cambio de pestañas */}
      <PunishmentModal
        isOpen={isPunishmentModalOpen}
        tabSwitchCount={punishmentTabSwitchCount}
        onComplete={handlePunishmentComplete}
      />
    </div>
  )
}
