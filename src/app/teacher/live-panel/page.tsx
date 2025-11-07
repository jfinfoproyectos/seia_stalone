"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Users, 
  BookOpen, 
  RefreshCw,   
  Play,
  Pause,
  BarChart3
} from "lucide-react";
import { LiveStatsCards } from "./components/LiveStatsCards";
import { LiveEvaluationsPanel } from "./components/LiveEvaluationsPanel";
import { LiveStudentsTable } from "./components/LiveStudentsTable";
import { LivePanelSettings } from "./components/LivePanelSettings";
import { LiveNotifications } from "./components/LiveNotifications";
import { useAllLiveData } from "./hooks/useLiveData";

export default function LivePanelPage() {
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | undefined>();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [showNotifications, setShowNotifications] = useState(true);

  const { 
    evaluations, 
    students,    
    loading,      
    refreshAll,
    startAllPolling,
    stopAllPolling
  } = useAllLiveData({ autoRefresh });

  const handleToggleAutoRefresh = () => {
    if (autoRefresh) {
      stopAllPolling();
    } else {
      startAllPolling();
    }
    setAutoRefresh(!autoRefresh);
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Monitor className="w-8 h-8 text-blue-600" />
            Panel en Vivo
            {autoRefresh && (
              <Badge variant="default" className="bg-green-500">
                <div className="w-2 h-2 bg-background rounded-full mr-1 animate-pulse" />
                En vivo
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo en tiempo real de evaluaciones y estudiantes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Reanudar
              </>
            )}
          </Button>
          
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <LiveNotifications enabled={showNotifications} />

            <LivePanelSettings
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              showNotifications={showNotifications}
              onShowNotificationsChange={setShowNotifications}
            />
          </div>
      </div>

      {/* Estadísticas principales */}
      <LiveStatsCards />

      {/* Contenido principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Evaluaciones
            {evaluations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {evaluations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Estudiantes
            {students.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {students.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de evaluaciones */}
            <LiveEvaluationsPanel
              onSelectEvaluation={setSelectedEvaluationId}
              selectedEvaluationId={selectedEvaluationId}
            />
            
            {/* Estudiantes activos recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Actividad Reciente
                  {students.filter(s => s.status === 'active').length > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      {students.filter(s => s.status === 'active').length} activos
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay actividad reciente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.evaluationTitle}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {student.progress}% completado
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.status === 'active' ? 'Activo ahora' : 
                             student.status === 'submitted' ? 'Enviada' : 'Inactivo'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {students.length > 5 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab("students")}
                      >
                        Ver todos los estudiantes ({students.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evaluaciones */}
        <TabsContent value="evaluations" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <LiveEvaluationsPanel
                onSelectEvaluation={setSelectedEvaluationId}
                selectedEvaluationId={selectedEvaluationId}
              />
            </div>
            <div className="xl:col-span-2">
              {selectedEvaluationId ? (
                <LiveStudentsTable
                  evaluationId={selectedEvaluationId}
                  showEvaluationColumn={false}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Selecciona una evaluación para ver los estudiantes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Estudiantes */}
        <TabsContent value="students" className="space-y-6">
          <LiveStudentsTable showEvaluationColumn={true} />
        </TabsContent>
      </Tabs>

      {/* Estado de conexión */}
      <div className="fixed bottom-4 right-4">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
            autoRefresh ? 'bg-green-500 dark:bg-green-600 animate-pulse' : 'bg-muted'
            }`} />
            <span className="text-muted-foreground">
              {autoRefresh ? 'Actualizando automáticamente' : 'Actualización pausada'}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}