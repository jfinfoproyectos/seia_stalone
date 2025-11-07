"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, BookOpen, CheckCircle, Activity } from "lucide-react";
import { useLiveStats } from "../hooks/useLiveData";

interface LiveStatsCardsProps {
  className?: string;
}

export function LiveStatsCards({ className }: LiveStatsCardsProps) {
  const { stats, loading, error, refresh } = useLiveStats();

  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error al cargar estadísticas</p>
              <Button onClick={refresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Evaluaciones Activas */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Evaluaciones Activas
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                stats.activeEvaluations
              )}
            </div>
            {stats.activeEvaluations > 0 && (
              <Badge variant="default" className="bg-green-500">
                <Activity className="w-3 h-3 mr-1" />
                En vivo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Evaluaciones activas
          </p>
        </CardContent>
        {stats.activeEvaluations > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 animate-pulse" />
        )}
      </Card>

      {/* Estudiantes Activos */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Estudiantes Activos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                stats.activeStudents
              )}
            </div>
            {stats.activeStudents > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                <div className="w-2 h-2 bg-background rounded-full mr-1 animate-pulse" />
                Online
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Estudiantes activos
          </p>
        </CardContent>
        {stats.activeStudents > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-pulse" />
        )}
      </Card>

      {/* Enviadas Hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Enviadas Hoy
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                stats.submittedToday
              )}
            </div>
            {stats.submittedToday > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Completadas
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Envíos hoy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}