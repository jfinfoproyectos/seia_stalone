'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { Loader2, Download, FileText, Settings, Eye, Wand2, CheckCircle, AlertCircle, RefreshCw, Edit3, Save } from 'lucide-react';
import { MarkdownViewer } from '@/app/teacher/evaluations/components/markdown-viewer';
import {
  generateTutorial,
  optimizeTutorial,
  generateTutorialVariations,
  validateTutorial,
  exportTutorialAsPDF,
  correctTutorialPrompt,
  type TutorialConfig,
  type TutorialResult,
  type TutorialOptimizationResult
} from '@/lib/gemini-tutorial-generator';

export default function TutorialGeneratorPage() {
  // Estados principales
  const [config, setConfig] = useState<TutorialConfig>({
    topic: '',
    targetAudience: 'intermediate',
    tutorialType: 'step-by-step',
    length: 'medium',
    includeExamples: true,
    includeExercises: true,
    includeResources: true,
    style: 'educational',
    language: 'spanish',
    format: 'markdown'
  });

  const [tutorial, setTutorial] = useState<TutorialResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<TutorialOptimizationResult | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; issues: string[]; suggestions: string[] } | null>(null);

  // Estados de carga
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCorrectingPrompt, setIsCorrectingPrompt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Referencias
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Manejadores de eventos
  const handleConfigChange = (key: keyof TutorialConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateTutorial = async () => {
    if (!config.topic.trim()) {
      toast.error('Por favor, ingresa un tema para el tutorial');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateTutorial(config);
      setTutorial(result);
      setEditedContent(result.markdownContent);
      setOptimizationResult(null);
      setVariations([]);
      setValidationResult(null);
      toast.success('Tutorial generado exitosamente');
    } catch (error) {
      console.error('Error generating tutorial:', error);
      toast.error('Error al generar el tutorial');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeTutorial = async () => {
    if (!tutorial) {
      toast.error('Primero genera un tutorial');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimizationGoals = [
        'Mejorar claridad y estructura',
        'Optimizar flujo de aprendizaje',
        'Enriquecer ejemplos prácticos',
        'Fortalecer objetivos de aprendizaje'
      ];
      
      const result = await optimizeTutorial(tutorial.markdownContent, optimizationGoals);
      setOptimizationResult(result);
      toast.success('Tutorial optimizado exitosamente');
    } catch (error) {
      console.error('Error optimizing tutorial:', error);
      toast.error('Error al optimizar el tutorial');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!tutorial) {
      toast.error('Primero genera un tutorial');
      return;
    }

    setIsGeneratingVariations(true);
    try {
      const variationTypes = ['audience', 'style', 'format'];
      const result = await generateTutorialVariations(tutorial.markdownContent, variationTypes);
      setVariations(result);
      toast.success('Variaciones generadas exitosamente');
    } catch (error) {
      console.error('Error generating variations:', error);
      toast.error('Error al generar variaciones');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleValidateTutorial = async () => {
    if (!tutorial) {
      toast.error('Primero genera un tutorial');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateTutorial(tutorial.markdownContent);
      setValidationResult(result);
      toast.success('Validación completada');
    } catch (error) {
      console.error('Error validating tutorial:', error);
      toast.error('Error al validar el tutorial');
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!tutorial) {
      toast.error('Primero genera un tutorial');
      return;
    }

    setIsExportingPDF(true);
    try {
      const pdfBuffer = await exportTutorialAsPDF(tutorial);
      
      // Crear blob y descargar
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = `${tutorial.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        downloadLinkRef.current.click();
      }
      
      URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!tutorial) {
      toast.error('Primero genera un tutorial');
      return;
    }

    const blob = new Blob([tutorial.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = `${tutorial.title.replace(/\s+/g, '-').toLowerCase()}.md`;
      downloadLinkRef.current.click();
    }
    
    URL.revokeObjectURL(url);
    toast.success('Markdown descargado exitosamente');
  };

  const handleCorrectPrompt = async () => {
    if (!config.topic.trim()) {
      toast.error('Ingresa un tema primero');
      return;
    }

    setIsCorrectingPrompt(true);
    try {
      const correctedPrompt = await correctTutorialPrompt(config.topic);
      setConfig(prev => ({ ...prev, topic: correctedPrompt }));
      toast.success('Descripción corregida exitosamente');
    } catch (error) {
      console.error('Error correcting prompt:', error);
      toast.error('Error al corregir la descripción');
    } finally {
      setIsCorrectingPrompt(false);
    }
  };

  const applyOptimization = () => {
    if (optimizationResult && tutorial) {
      const optimizedTutorial: TutorialResult = {
        ...tutorial,
        markdownContent: optimizationResult.optimizedContent
      };
      setTutorial(optimizedTutorial);
      setEditedContent(optimizationResult.optimizedContent);
      setOptimizationResult(null);
      toast.success('Optimización aplicada al tutorial');
    }
  };

  const handleSaveEdit = () => {
    if (tutorial && editedContent.trim()) {
      setTutorial({
        ...tutorial,
        markdownContent: editedContent
      });
      setIsEditing(false);
      toast.success('Cambios guardados exitosamente');
    }
  };

  const handleCancelEdit = () => {
    if (tutorial) {
      setEditedContent(tutorial.markdownContent);
      setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Generador de Tutoriales</h1>
        <p className="text-muted-foreground">Crea tutoriales educativos personalizados usando inteligencia artificial</p>
      </div>

      {/* Panel de Configuración */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Personaliza tu tutorial según tus necesidades
            </CardDescription>
          </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-5">
                {/* Sección 1: Tema del Tutorial */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <Label htmlFor="topic" className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4" />Tema del Tutorial
                  </Label>
                  <div className="flex gap-3">
                    <Textarea
                      id="topic"
                      placeholder="Describe el tema que quieres enseñar (ej: Introducción a React Hooks, Fundamentos de Machine Learning...)"
                      value={config.topic}
                      onChange={(e) => handleConfigChange('topic', e.target.value)}
                      rows={2}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCorrectPrompt}
                      disabled={isCorrectingPrompt || !config.topic.trim()}
                      className="shrink-0 h-fit"
                      title="Mejorar descripción"
                    >
                      {isCorrectingPrompt ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Sección 2: Configuración del Tutorial */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />Configuración del Tutorial
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Audiencia Objetivo</Label>
                      <Select value={config.targetAudience} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => handleConfigChange('targetAudience', value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">🟢 Principiante</SelectItem>
                          <SelectItem value="intermediate">🟡 Intermedio</SelectItem>
                          <SelectItem value="advanced">🔴 Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Tipo de Tutorial</Label>
                      <Select value={config.tutorialType} onValueChange={(value: 'step-by-step' | 'conceptual' | 'practical' | 'comprehensive') => handleConfigChange('tutorialType', value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="step-by-step">📋 Paso a Paso</SelectItem>
                          <SelectItem value="conceptual">💡 Conceptual</SelectItem>
                          <SelectItem value="practical">🛠️ Práctico</SelectItem>
                          <SelectItem value="comprehensive">📚 Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Extensión</Label>
                      <Select value={config.length} onValueChange={(value: 'short' | 'medium' | 'long') => handleConfigChange('length', value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">⚡ Corto (1-2k palabras)</SelectItem>
                          <SelectItem value="medium">📄 Medio (2-4k palabras)</SelectItem>
                          <SelectItem value="long">📖 Largo (4-8k palabras)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Estilo de Escritura</Label>
                      <Select value={config.style} onValueChange={(value: 'formal' | 'casual' | 'technical' | 'educational') => handleConfigChange('style', value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">🎩 Formal</SelectItem>
                          <SelectItem value="casual">😊 Casual</SelectItem>
                          <SelectItem value="technical">⚙️ Técnico</SelectItem>
                          <SelectItem value="educational">🎓 Educativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Sección 3: Opciones de Contenido */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4" />Contenido y Formato
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-medium text-muted-foreground">Idioma:</Label>
                      <Select value={config.language} onValueChange={(value: 'spanish' | 'english') => handleConfigChange('language', value)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spanish">🇪🇸 Español</SelectItem>
                          <SelectItem value="english">🇺🇸 English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-md">
                        <Switch
                          id="examples"
                          checked={config.includeExamples}
                          onCheckedChange={(checked) => handleConfigChange('includeExamples', checked)}
                          className="scale-75"
                        />
                        <Label htmlFor="examples" className="text-xs font-medium cursor-pointer">💡 Ejemplos</Label>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-md">
                        <Switch
                          id="exercises"
                          checked={config.includeExercises}
                          onCheckedChange={(checked) => handleConfigChange('includeExercises', checked)}
                          className="scale-75"
                        />
                        <Label htmlFor="exercises" className="text-xs font-medium cursor-pointer">🏋️ Ejercicios</Label>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-md">
                        <Switch
                          id="resources"
                          checked={config.includeResources}
                          onCheckedChange={(checked) => handleConfigChange('includeResources', checked)}
                          className="scale-75"
                        />
                        <Label htmlFor="resources" className="text-xs font-medium cursor-pointer">📚 Recursos</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 4: Generar Tutorial */}
                <div className="pt-2">
                  <Button
                    onClick={handleGenerateTutorial}
                    disabled={isGenerating || !config.topic.trim()}
                    className="w-full h-11 text-sm font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generar Tutorial
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Principal */}
        <div className="w-full">
          {tutorial ? (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="optimization">Optimización</TabsTrigger>
                <TabsTrigger value="variations">Variaciones</TabsTrigger>
                <TabsTrigger value="validation">Validación</TabsTrigger>
              </TabsList>

              {/* Vista Previa */}
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{tutorial.title}</CardTitle>
                        <CardDescription>{tutorial.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadMarkdown}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Markdown
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportPDF}
                          disabled={isExportingPDF}
                        >
                          {isExportingPDF ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          PDF
                        </Button>
                      </div>
                    </div>
                    
                    {/* Metadatos */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary">
                        {tutorial.metadata.estimatedReadTime}
                      </Badge>
                      <Badge variant="outline">
                        Nivel: {tutorial.metadata.difficulty}
                      </Badge>
                      {tutorial.metadata.learningObjectives.length > 0 && (
                        <Badge variant="outline">
                          {tutorial.metadata.learningObjectives.length} objetivos
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MarkdownViewer content={tutorial.markdownContent} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edición */}
              <TabsContent value="edit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Editar Tutorial</CardTitle>
                        <CardDescription>
                          Modifica el contenido del tutorial directamente
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={!editedContent.trim()}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Guardar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[500px] font-mono text-sm"
                        placeholder="Contenido del tutorial en Markdown..."
                      />
                    ) : (
                      <MarkdownViewer content={tutorial.markdownContent} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Optimización */}
              <TabsContent value="optimization" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimización del Tutorial</CardTitle>
                    <CardDescription>
                      Mejora automáticamente la estructura y contenido del tutorial
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleOptimizeTutorial}
                      disabled={isOptimizing}
                      className="w-full"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Optimizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Optimizar Tutorial
                        </>
                      )}
                    </Button>

                    {optimizationResult && (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Mejoras Implementadas:</h4>
                          <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                            {optimizationResult.improvements.map((improvement, index) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Razonamiento:</h4>
                          <p className="text-sm text-blue-700">{optimizationResult.reasoning}</p>
                        </div>

                        <Button onClick={applyOptimization} className="w-full">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aplicar Optimización
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Variaciones */}
              <TabsContent value="variations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Variaciones del Tutorial</CardTitle>
                    <CardDescription>
                      Genera diferentes versiones adaptadas a distintas audiencias y estilos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleGenerateVariations}
                      disabled={isGeneratingVariations}
                      className="w-full"
                    >
                      {isGeneratingVariations ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando Variaciones...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Generar Variaciones
                        </>
                      )}
                    </Button>

                    {variations.length > 0 && (
                      <div className="space-y-4">
                        {variations.map((variation, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Variación {index + 1}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <MarkdownViewer content={variation} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Validación */}
              <TabsContent value="validation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Validación del Tutorial</CardTitle>
                    <CardDescription>
                      Evalúa la calidad y estructura del tutorial generado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleValidateTutorial}
                      disabled={isValidating}
                      className="w-full"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Validar Tutorial
                        </>
                      )}
                    </Button>

                    {validationResult && (
                      <div className="space-y-4">
                        <div className={`p-4 border rounded-lg ${
                          validationResult.isValid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {validationResult.isValid ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                            )}
                            <h4 className={`font-medium ${
                              validationResult.isValid ? 'text-green-800' : 'text-yellow-800'
                            }`}>
                              {validationResult.isValid ? 'Tutorial Válido' : 'Necesita Mejoras'}
                            </h4>
                          </div>
                        </div>

                        {validationResult.issues.length > 0 && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2">Problemas Encontrados:</h4>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                              {validationResult.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validationResult.suggestions.length > 0 && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Sugerencias de Mejora:</h4>
                            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                              {validationResult.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Genera tu primer tutorial
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configura los parámetros en el panel izquierdo y haz clic en &quot;Generar Tutorial&quot;
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      {/* Link de descarga oculto */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </div>
  );
}