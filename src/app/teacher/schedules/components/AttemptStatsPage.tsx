'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Users, Award, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarkdownViewer } from '@/app/teacher/evaluations/components/markdown-viewer';

interface QuestionAnalysis {
  questionId: number;
  text: string;
  type: string;
  averageScore: number;
}

interface Submission {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  score: number | null;
  submittedAt: string | null;
}

type SubmissionData = Omit<Submission, 'submittedAt'> & { submittedAt: Date | null };

interface Attempt {
  id: number;
  evaluationId: number;
  uniqueCode: string;
  startTime: Date;
  endTime: Date;
  maxSubmissions?: number | null;
  evaluation?: {
    title: string;
  };
  _count: {
    submissions: number;
  };
}

interface AttemptStatsPageProps {
  attempt: Attempt;
  onBack: () => void;
}

export function AttemptStatsPage({ attempt, onBack }: AttemptStatsPageProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [pieModalOpen, setPieModalOpen] = useState(false);
  const [pieModalContent, setPieModalContent] = useState<{ title: string; students: Submission[] } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionAnalysis | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { getSubmissionsByAttempt, getQuestionAnalysis } = await import('../actions');
      const submissionsData = await getSubmissionsByAttempt(attempt.id);
      const analysisData = await getQuestionAnalysis(attempt.id);
      
      const transformedSubmissions: Submission[] = submissionsData.map((sub: SubmissionData) => ({
        ...sub,
        submittedAt: sub.submittedAt?.toISOString() || null,
      }));
      
      setSubmissions(transformedSubmissions);
      setQuestionAnalysis(analysisData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [attempt.id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handlePieClick = (data: { name: string }) => {
    const { name } = data;
    if (!name) return;

    let filteredStudents: Submission[] = [];

    if (name.startsWith('Excelente')) {
      filteredStudents = submissions.filter(s => s.score !== null && (s.score || 0) >= 4.5);
    } else if (name.startsWith('Muy Bueno')) {
      filteredStudents = submissions.filter(s => s.score !== null && (s.score || 0) >= 4.0 && (s.score || 0) < 4.5);
    } else if (name.startsWith('Bueno')) {
      filteredStudents = submissions.filter(s => s.score !== null && (s.score || 0) >= 3.5 && (s.score || 0) < 4.0);
    } else if (name.startsWith('Regular')) {
      filteredStudents = submissions.filter(s => s.score !== null && (s.score || 0) >= 3.0 && (s.score || 0) < 3.5);
    } else if (name.startsWith('Insuficiente')) {
      filteredStudents = submissions.filter(s => s.score !== null && (s.score || 0) < 3.0);
    } else if (name.startsWith('Sin calificar')) {
      filteredStudents = submissions.filter(s => s.score === null);
    }

    setPieModalContent({ title: `Estudiantes en "${name}"`, students: filteredStudents });
    setPieModalOpen(true);
  };

  const handlePreviewClick = (question: QuestionAnalysis) => {
    setSelectedQuestion(question);
    setPreviewModalOpen(true);
  };

  // Función para formatear decimales con solo un dígito
  const formatDecimal = (value: number): number => {
    return Math.round(value * 10) / 10;
  };

  // Calcular estadísticas
  const totalSubmissions = submissions.length;
  const averageScore = submissions.filter(s => s.score !== null).length > 0 
    ? submissions.filter(s => s.score !== null).reduce((acc, s) => acc + (s.score || 0), 0) / submissions.filter(s => s.score !== null).length
    : 0;

  // Datos para gráfico de barras de participantes
  const participantsData = submissions.map(sub => ({
    name: `${sub.firstName} ${sub.lastName}`,
    score: formatDecimal(sub.score || 0),
    submitted: sub.submittedAt ? 'Enviado' : 'Pendiente',
  }));

  // Datos para el gráfico combinado de líneas
  const combinedData = submissions.map(sub => ({
    name: `${sub.firstName} ${sub.lastName}`,
    score: sub.score,
    score_norm: (sub.score || 0) / 5, // La calificación es de 0-5
  }));

  // Ordenar participantes por calificación (descendente)
  const rankedParticipants = [...submissions]
    .sort((a, b) => {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return (b.score || 0) - (a.score || 0);
    });

  // Datos para gráfico de torta de calificaciones
  const gradeDistribution = [
    { name: 'Excelente (4.5-5.0)', value: submissions.filter(s => s.score !== null && (s.score || 0) >= 4.5).length, color: '#10b981' },
    { name: 'Muy Bueno (4.0-4.4)', value: submissions.filter(s => s.score !== null && (s.score || 0) >= 4.0 && (s.score || 0) < 4.5).length, color: '#3b82f6' },
    { name: 'Bueno (3.5-3.9)', value: submissions.filter(s => s.score !== null && (s.score || 0) >= 3.5 && (s.score || 0) < 4.0).length, color: '#f59e0b' },
    { name: 'Regular (3.0-3.4)', value: submissions.filter(s => s.score !== null && (s.score || 0) >= 3.0 && (s.score || 0) < 3.5).length, color: '#f97316' },
    { name: 'Insuficiente (0.0-2.9)', value: submissions.filter(s => s.score !== null && (s.score || 0) < 3.0).length, color: '#ef4444' },
    { name: 'Sin calificar', value: submissions.filter(s => s.score === null).length, color: '#6b7280' },
  ].filter(item => item.value > 0); // Solo mostrar categorías con datos

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Estadísticas - {attempt.evaluation?.title}
            </h1>
            <p className="text-muted-foreground">Código: {attempt.uniqueCode}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando estadísticas...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  Participantes registrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatDecimal(averageScore)}</div>
                <p className="text-xs text-muted-foreground">
                  Puntuación promedio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico combinado de líneas */}
          <Card>
            <CardHeader>
              <CardTitle>Calificaciones por Participante</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} interval={0} />
                  <YAxis label={{ value: 'Calificación', angle: -90, position: 'insideLeft' }} domain={[0, 5]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)' }}
                    formatter={(value: number, name: string, props) => {
                      const { payload } = props as { payload: typeof combinedData[0] };
                      if (name === 'Calificación') return [`${payload.score?.toFixed(1) || 'N/A'} / 5.0`, name];
                      return [value, name];
                    }}
                    labelFormatter={(label: string) => <span className="font-bold">{label}</span>}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" name="Calificación" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 gap-8">
            {/* Gráfico de barras - Puntuaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Puntuaciones por Participante</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={participantsData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)} puntos`, 'Calificación']}
                      labelFormatter={(label) => `Estudiante: ${label}`}
                    />
                    <Bar dataKey="score" fill="#3b82f6" name="Calificación" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de torta y Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Gráfico de torta - Distribución de calificaciones */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distribución de Calificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="45%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      onClick={handlePieClick}
                      cursor="pointer"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} estudiante(s)`, name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ranking de Participantes */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Ranking de Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rank</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Participante</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Calificación</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rankedParticipants.map((participant, index) => (
                        <tr key={participant.id} className={participant.score === null ? 'bg-muted/50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{participant.score !== null ? index + 1 : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{`${participant.firstName} ${participant.lastName}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">{participant.score?.toFixed(1) || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {participant.submittedAt ? <Badge variant="default">Enviado</Badge> : <Badge variant="secondary">Pendiente</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análisis por Pregunta */}
          {questionAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análisis por Pregunta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionAnalysis.map((question, index) => (
                    <div key={question.questionId} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <p className="text-base font-semibold">
                            Pregunta {index + 1}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => handlePreviewClick(question)}>
                            Vista Previa
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={question.type === 'code' ? 'default' : 'secondary'}>
                            {question.type === 'code' ? 'Código' : 'Texto'}
                          </Badge>
                          <span className="text-sm font-semibold w-16 text-right">{question.averageScore.toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${(question.averageScore / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={pieModalOpen} onOpenChange={setPieModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{pieModalContent?.title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[60vh] mt-4">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Calificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pieModalContent?.students?.map(student => (
                      <tr key={student.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{`${student.firstName} ${student.lastName}`}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">{student.email}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-foreground">{student.score?.toFixed(1) || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pieModalContent?.students?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay estudiantes en esta categoría.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Vista previa flotante moderna */}
          {previewModalOpen && selectedQuestion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop con efecto blur */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
                onClick={() => setPreviewModalOpen(false)}
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
                        selectedQuestion.type === 'code' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-gradient-to-br from-green-500 to-teal-600'
                      } shadow-lg`}>
                        <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                        {selectedQuestion.type === 'code' ? (
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
                          Vista Previa de la Pregunta
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            selectedQuestion.type === 'code'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {selectedQuestion.type === 'code' ? 'Código' : 'Texto'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Promedio: {selectedQuestion.averageScore.toFixed(1)}/5.0
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón cerrar elegante */}
                    <button
                      onClick={() => setPreviewModalOpen(false)}
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
                      <MarkdownViewer content={selectedQuestion.text} />
                    </div>
                  </div>
                </div>
                
                {/* Barra inferior con información */}
                <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Pregunta ID: {selectedQuestion.questionId}
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="text-sm text-muted-foreground">
                      Puntuación promedio: {selectedQuestion.averageScore.toFixed(1)}/5.0
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedQuestion.averageScore >= 4.0 ? 'bg-green-500' :
                      selectedQuestion.averageScore >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {selectedQuestion.averageScore >= 4.0 ? 'Excelente' :
                       selectedQuestion.averageScore >= 3.0 ? 'Bueno' : 'Necesita mejora'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}