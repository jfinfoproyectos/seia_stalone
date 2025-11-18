"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  RefreshCw, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity
} from "lucide-react";
import { useLiveStudents } from "../hooks/useLiveData";
import { LiveStudentData } from "../actions";
// Mensajería eliminada del panel en vivo
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LiveStudentsTableProps {
  evaluationId?: number;
  className?: string;
  showEvaluationColumn?: boolean;
}

export function LiveStudentsTable({ 
  evaluationId, 
  className,
  showEvaluationColumn = false 
}: LiveStudentsTableProps) {
  const { students, loading, error, refresh } = useLiveStudents(evaluationId);


  const getStatusIcon = (status: LiveStudentData['status']) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: LiveStudentData['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-500 dark:bg-green-600 text-white">
            <div className="w-2 h-2 bg-background rounded-full mr-1 animate-pulse" />
            Activo
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enviada
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Inactivo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Desconocido
          </Badge>
        );
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estudiantes en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                </div>
                <div className="w-20 h-6 bg-muted animate-pulse rounded" />
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
            <Users className="w-5 h-5" />
            Estudiantes en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error al cargar estudiantes</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estudiantes en Tiempo Real
          </CardTitle>
          <Button onClick={refresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay estudiantes presentando evaluaciones</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los estudiantes aparecerán aquí cuando inicien una evaluación
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeStudents = students.filter(s => s.status === 'active');
  const submittedStudents = students.filter(s => s.status === 'submitted');
  const inactiveStudents = students.filter(s => s.status === 'inactive');

  return (
    <>
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Estudiantes en Tiempo Real
          <Badge variant="secondary">{students.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Enviar a todos eliminado */}
          <Button onClick={refresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{activeStudents.length}</div>
            <div className="text-sm text-muted-foreground">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{inactiveStudents.length}</div>
            <div className="text-sm text-muted-foreground">Inactivos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{submittedStudents.length}</div>
            <div className="text-sm text-muted-foreground">Enviadas</div>
          </div>
        </div>

        {/* Lista de estudiantes */}
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className={`p-4 border rounded-lg transition-all ${
                student.status === 'active' 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' 
                  : student.status === 'submitted'
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={`text-sm font-medium ${
                    student.status === 'active' 
                      ? 'bg-green-500 text-white' 
                      : student.status === 'submitted'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {getInitials(student.firstName, student.lastName)}
                  </AvatarFallback>
                </Avatar>

                {/* Información del estudiante */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">
                      {student.firstName} {student.lastName}
                    </h3>
                    {getStatusIcon(student.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  {showEvaluationColumn && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {student.evaluationTitle}
                    </p>
                  )}
                </div>

                {/* Progreso */}
                <div className="flex-shrink-0 w-24">
                  <div className="text-xs text-muted-foreground mb-1">
                    {student.answersCount}/{student.totalQuestions}
                  </div>
                  <Progress value={student.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {student.progress}%
                  </div>
                </div>

                {/* Estado y última actividad */}
                <div className="flex-shrink-0 text-right">
                  <div className="mb-2">
                    {getStatusBadge(student.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(student.lastActivity, { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </div>
                  {student.score !== null && (
                    <div className="text-xs font-medium text-foreground mt-1">
                      Nota: {student.score.toFixed(1)}
                    </div>
                  )}
                  <div className="mt-2 flex items-center">
                    {/* Enviar mensaje eliminado */}
                    {/* Bloquear eliminado */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    {/* Diálogos de mensajería eliminados */}
    </>
  );
}