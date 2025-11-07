"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { sendTemporaryMessageToStudent, sendTemporaryMessageToAllStudents, blockStudent, unblockStudent } from "../actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

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
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; student?: LiveStudentData; content: string; sending: boolean; result?: string | null }>({ open: false, content: "", sending: false, result: null });
  const [broadcastDialog, setBroadcastDialog] = useState<{ open: boolean; content: string; sending: boolean; result?: string | null }>({ open: false, content: "", sending: false, result: null });
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; student?: LiveStudentData; minutes: number; sending: boolean; result?: string | null }>({ open: false, minutes: 10, sending: false, result: null });

  const openMessageDialog = (student: LiveStudentData) => {
    setMessageDialog({ open: true, student, content: "", sending: false, result: null });
  };

  const openBroadcastDialog = () => {
    setBroadcastDialog({ open: true, content: "", sending: false, result: null });
  };

  const openBlockDialog = (student: LiveStudentData) => {
    setBlockDialog({ open: true, student, minutes: 10, sending: false, result: null });
  };

  const sendMessage = async () => {
    if (!messageDialog.student || !messageDialog.content.trim()) return;
    setMessageDialog((prev) => ({ ...prev, sending: true, result: null }));
    try {
      const res = await sendTemporaryMessageToStudent({
        uniqueCode: messageDialog.student.uniqueCode,
        email: messageDialog.student.email,
        content: messageDialog.content,
      });
      if (res?.success) {
        setMessageDialog((prev) => ({ ...prev, sending: false, result: "Mensaje enviado" }));
        setTimeout(() => setMessageDialog({ open: false, student: undefined, content: "", sending: false, result: null }), 800);
      } else {
        setMessageDialog((prev) => ({ ...prev, sending: false, result: "Error al enviar" }));
      }
    } catch (e) {
      console.error("Error sending message:", e);
      setMessageDialog((prev) => ({ ...prev, sending: false, result: "Error al enviar" }));
    }
  };

  const sendBroadcastMessage = async () => {
    if (!broadcastDialog.content.trim()) return;
    setBroadcastDialog((prev) => ({ ...prev, sending: true, result: null }));
    try {
      let res;
      if (typeof evaluationId === "number") {
        res = await sendTemporaryMessageToAllStudents({ evaluationId, content: broadcastDialog.content });
      } else {
        const recipients = students.map((s) => ({ uniqueCode: s.uniqueCode, email: s.email }));
        res = await sendTemporaryMessageToAllStudents({ recipients, content: broadcastDialog.content });
      }
      if (res?.success) {
        setBroadcastDialog((prev) => ({ ...prev, sending: false, result: `Mensaje enviado a ${res.sent} estudiantes` }));
        setTimeout(() => setBroadcastDialog({ open: false, content: "", sending: false, result: null }), 1000);
      } else {
        setBroadcastDialog((prev) => ({ ...prev, sending: false, result: "Error al enviar" }));
      }
    } catch (e) {
      console.error("Error sending broadcast message:", e);
      setBroadcastDialog((prev) => ({ ...prev, sending: false, result: "Error al enviar" }));
    }
  };

  const applyBlock = async () => {
    if (!blockDialog.student) return;
    setBlockDialog((prev) => ({ ...prev, sending: true, result: null }));
    try {
      const res = await blockStudent({
        uniqueCode: blockDialog.student.uniqueCode,
        email: blockDialog.student.email,
        minutes: blockDialog.minutes,
      });
      if (res?.success) {
        setBlockDialog((prev) => ({ ...prev, sending: false, result: `Bloqueado por ${blockDialog.minutes} min` }));
        setTimeout(() => setBlockDialog({ open: false, student: undefined, minutes: 10, sending: false, result: null }), 1000);
      } else {
        setBlockDialog((prev) => ({ ...prev, sending: false, result: "No se pudo bloquear" }));
      }
    } catch (e) {
      console.error("Error blocking student:", e);
      setBlockDialog((prev) => ({ ...prev, sending: false, result: "Error al bloquear" }));
    }
  };

  const applyUnblock = async () => {
    if (!blockDialog.student) return;
    setBlockDialog((prev) => ({ ...prev, sending: true, result: null }));
    try {
      const res = await unblockStudent({
        uniqueCode: blockDialog.student.uniqueCode,
        email: blockDialog.student.email,
      });
      if (res?.success) {
        setBlockDialog((prev) => ({ ...prev, sending: false, result: "Desbloqueado" }));
        setTimeout(() => setBlockDialog({ open: false, student: undefined, minutes: 10, sending: false, result: null }), 700);
      } else {
        setBlockDialog((prev) => ({ ...prev, sending: false, result: "No se pudo desbloquear" }));
      }
    } catch (e) {
      console.error("Error unblocking student:", e);
      setBlockDialog((prev) => ({ ...prev, sending: false, result: "Error al desbloquear" }));
    }
  };

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
          <Button onClick={openBroadcastDialog} variant="outline" size="sm">
            Enviar a todos
          </Button>
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
                    <Button variant="outline" size="sm" onClick={() => openMessageDialog(student)}>
                      Enviar mensaje
                    </Button>
                    <Button variant="secondary" size="sm" className="ml-2" onClick={() => openBlockDialog(student)}>
                      Bloquear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}>
      <AlertDialogContent className="max-w-md bg-card text-card-foreground border shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">Enviar mensaje al estudiante</AlertDialogTitle>
          <AlertDialogDescription>
            {messageDialog.student ? (
              <div className="text-sm mb-3">
                {messageDialog.student.firstName} {messageDialog.student.lastName} — {messageDialog.student.email}
              </div>
            ) : null}
            <Textarea
              value={messageDialog.content}
              onChange={(e) => setMessageDialog((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe el mensaje para el estudiante"
              className="mt-2 bg-background"
            />
            {messageDialog.result && (
              <div className="text-xs text-muted-foreground mt-2">{messageDialog.result}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => setMessageDialog({ open: false, student: undefined, content: "", sending: false, result: null })}>
            Cancelar
          </Button>
          <AlertDialogAction onClick={sendMessage} disabled={messageDialog.sending || !messageDialog.content.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {messageDialog.sending ? "Enviando..." : "Enviar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog((prev) => ({ ...prev, open }))}>
      <AlertDialogContent className="max-w-md bg-card text-card-foreground border shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">Bloquear estudiante</AlertDialogTitle>
          <AlertDialogDescription>
            {blockDialog.student ? (
              <div className="text-sm mb-3">
                {blockDialog.student.firstName} {blockDialog.student.lastName} — {blockDialog.student.email}
              </div>
            ) : null}
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm text-muted-foreground" htmlFor="minutes">Minutos</label>
              <input
                id="minutes"
                type="number"
                min={1}
                value={blockDialog.minutes}
                onChange={(e) => setBlockDialog((prev) => ({ ...prev, minutes: parseInt(e.target.value || '10', 10) }))}
                className="w-24 px-2 py-1 border rounded bg-background"
              />
            </div>
            {blockDialog.result && (
              <div className="text-xs text-muted-foreground mt-2">{blockDialog.result}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => setBlockDialog({ open: false, student: undefined, minutes: 10, sending: false, result: null })}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={applyUnblock} disabled={blockDialog.sending}>
            {blockDialog.sending ? "Procesando..." : "Desbloquear"}
          </Button>
          <AlertDialogAction onClick={applyBlock} disabled={blockDialog.sending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {blockDialog.sending ? "Procesando..." : "Bloquear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={broadcastDialog.open} onOpenChange={(open) => setBroadcastDialog((prev) => ({ ...prev, open }))}>
      <AlertDialogContent className="max-w-md bg-card text-card-foreground border shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">Enviar mensaje a todos los estudiantes</AlertDialogTitle>
          <AlertDialogDescription>
            <Textarea
              value={broadcastDialog.content}
              onChange={(e) => setBroadcastDialog((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe el mensaje para todos"
              className="mt-2 bg-background"
            />
            {broadcastDialog.result && (
              <div className="text-xs text-muted-foreground mt-2">{broadcastDialog.result}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => setBroadcastDialog({ open: false, content: "", sending: false, result: null })}>
            Cancelar
          </Button>
          <AlertDialogAction onClick={sendBroadcastMessage} disabled={broadcastDialog.sending || !broadcastDialog.content.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {broadcastDialog.sending ? "Enviando..." : "Enviar a todos"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}