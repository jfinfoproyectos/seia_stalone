"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Clock, Users, BookOpen, ExternalLink } from "lucide-react";
import { useLiveEvaluations } from "../hooks/useLiveData";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LiveEvaluationsPanelProps {
  onSelectEvaluation?: (evaluationId: number) => void;
  selectedEvaluationId?: number;
  className?: string;
}

export function LiveEvaluationsPanel({ 
  onSelectEvaluation, 
  selectedEvaluationId,
  className 
}: LiveEvaluationsPanelProps) {
  const { evaluations, loading, error, refresh } = useLiveEvaluations();

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const timeLeft = endTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) return "Finalizada";
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  const getProgressPercentage = (startTime: Date, endTime: Date) => {
    const now = new Date();
    const total = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Evaluaciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  <div className="h-2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Evaluaciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error al cargar evaluaciones</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Evaluaciones Activas
          </CardTitle>
          <Button onClick={refresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay evaluaciones activas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Las evaluaciones aparecerán aquí cuando estén en curso
              </p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Evaluaciones Activas
          <Badge variant="secondary">{evaluations.length}</Badge>
        </CardTitle>
        <Button onClick={refresh} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const isSelected = selectedEvaluationId === evaluation.id;
            const progress = getProgressPercentage(evaluation.startTime, evaluation.endTime);
            const timeRemaining = getTimeRemaining(evaluation.endTime);
            
            return (
              <div
                key={evaluation.id}
                className={`p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20' 
                    : 'border-border hover:border-border/80 bg-card dark:bg-card'
                }`}
                onClick={() => onSelectEvaluation?.(evaluation.id)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {evaluation.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {evaluation.uniqueCode}
                        </Badge>
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
                          En vivo
                        </Badge>
                      </div>
                    </div>
                    {onSelectEvaluation && (
                      <Button variant="ghost" size="sm" className="ml-2">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {evaluation.activeStudents}
                      </div>
                      <div className="text-xs text-muted-foreground">Activos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {evaluation.submittedStudents}
                      </div>
                      <div className="text-xs text-muted-foreground">Enviadas</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {evaluation.totalStudents}
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>

                  {/* Progreso de tiempo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeRemaining}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(progress)}% transcurrido
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Inicio: {formatDistanceToNow(evaluation.startTime, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {evaluation.totalQuestions} preguntas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}