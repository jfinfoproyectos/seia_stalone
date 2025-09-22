'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitBranch,
  Download,
  Copy,
  Wand2,
  Loader2,
  Eye,
  Code,
  Settings,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  generateMermaidDiagram,
  optimizeMermaidCode,
  validateMermaidCode,
  generateMermaidVariations,
  correctPromptWriting,
  MermaidDiagramResult
} from '@/lib/gemini-mermaid-generator';

// Componente para renderizar Mermaid
interface MermaidViewerProps {
  code: string;
  title?: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ code, title }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Cargar Mermaid dinámicamente
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Arial, sans-serif'
        });

        setIsLoaded(true);
      } catch (err) {
        setError('Error al cargar Mermaid');
        console.error('Error loading Mermaid:', err);
      }
    };

    loadMermaid();
  }, []);

  useEffect(() => {
    if (isLoaded && code) {
      const renderDiagram = async () => {
        try {
          const mermaid = (await import('mermaid')).default;
          const element = document.getElementById('mermaid-diagram');
          if (element) {
            element.innerHTML = code;
            await mermaid.init(undefined, element);
          }
        } catch (err) {
          setError('Error al renderizar el diagrama');
          console.error('Error rendering diagram:', err);
        }
      };

      renderDiagram();
    }
  }, [isLoaded, code]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Cargando visualizador...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <div 
        id="mermaid-diagram" 
        className="flex justify-center items-center min-h-[200px]"
        style={{ fontSize: '14px' }}
      >
        {code}
      </div>
    </div>
  );
};

export default function MermaidGeneratorPage() {
  const { toast } = useToast();
  
  // Estados principales
  const [userPrompt, setUserPrompt] = useState('');
  const [diagramType, setDiagramType] = useState('auto');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados del diagrama
  const [currentDiagram, setCurrentDiagram] = useState<MermaidDiagramResult | null>(null);
  const [diagramHistory, setDiagramHistory] = useState<MermaidDiagramResult[]>([]);
  const [variations, setVariations] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } | null>(null);
  
  // Estados de la interfaz
  const [activeTab, setActiveTab] = useState('generator');
  const [correctingPrompt, setCorrectingPrompt] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  // Tipos de diagrama disponibles
  const diagramTypes = [
    { value: 'flowchart', label: 'Diagrama de Flujo', description: 'Para procesos y decisiones' },
    { value: 'sequence', label: 'Diagrama de Secuencia', description: 'Para interacciones temporales' },
    { value: 'class', label: 'Diagrama de Clases', description: 'Para estructuras de datos' },
    { value: 'state', label: 'Diagrama de Estados', description: 'Para máquinas de estado' },
    { value: 'er', label: 'Diagrama ER', description: 'Para bases de datos' },
    { value: 'gantt', label: 'Diagrama de Gantt', description: 'Para planificación de proyectos' },
    { value: 'pie', label: 'Gráfico Circular', description: 'Para mostrar proporciones' },
    { value: 'journey', label: 'Viaje del Usuario', description: 'Para experiencias de usuario' },
    { value: 'gitgraph', label: 'Diagrama de Git', description: 'Para ramas de repositorio' },
    { value: 'mindmap', label: 'Mapa Mental', description: 'Para organizar ideas' },
    { value: 'timeline', label: 'Línea de Tiempo', description: 'Para eventos cronológicos' }
  ];

  // Prompts de ejemplo
  const examplePrompts = [
    {
      title: 'Proceso de Desarrollo de Software',
      prompt: 'Crea un diagrama de flujo que muestre el proceso completo de desarrollo de software, desde la planificación hasta el despliegue, incluyendo las fases de análisis, diseño, codificación, pruebas y mantenimiento.',
      type: 'flowchart'
    },
    {
      title: 'Sistema de Autenticación',
      prompt: 'Diseña un diagrama de secuencia que muestre cómo funciona un sistema de autenticación de usuarios, incluyendo login, validación de credenciales, generación de tokens y acceso a recursos protegidos.',
      type: 'sequence'
    },
    {
      title: 'Estructura de Base de Datos E-commerce',
      prompt: 'Crea un diagrama entidad-relación para un sistema de e-commerce que incluya usuarios, productos, pedidos, categorías y métodos de pago.',
      type: 'er'
    },
    {
      title: 'Planificación de Proyecto',
      prompt: 'Genera un diagrama de Gantt para un proyecto de desarrollo web de 3 meses, incluyendo fases de diseño, desarrollo frontend, desarrollo backend, testing y despliegue.',
      type: 'gantt'
    }
  ];

  // Función para generar diagrama
  const handleGenerateDiagram = async () => {
    if (!userPrompt.trim()) {
      setError('Por favor, describe el diagrama que quieres crear');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await generateMermaidDiagram(
        userPrompt,
        diagramType === 'auto' ? undefined : diagramType || undefined,
        complexity
      );
      
      setCurrentDiagram(result);
      setDiagramHistory(prev => [result, ...prev.slice(0, 9)]); // Mantener últimos 10
      setActiveTab('viewer');
      
      toast({
        title: "Diagrama generado",
        description: `Se creó un ${result.diagramType} exitosamente`,
      });
    } catch (error) {
      console.error('Error generating diagram:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al generar el diagrama');
    } finally {
      setLoading(false);
    }
  };

  // Función para optimizar código
  const handleOptimizeCode = async () => {
    if (!currentDiagram) return;

    setOptimizing(true);
    try {
      const result = await optimizeMermaidCode(
        currentDiagram.mermaidCode,
        ['Mejorar legibilidad', 'Optimizar estructura', 'Añadir estilos']
      );
      
      const optimizedDiagram: MermaidDiagramResult = {
        ...currentDiagram,
        mermaidCode: result.optimizedCode,
        title: currentDiagram.title + ' (Optimizado)',
        suggestions: result.improvements
      };
      
      setCurrentDiagram(optimizedDiagram);
      
      toast({
        title: "Código optimizado",
        description: "El diagrama ha sido mejorado exitosamente",
      });
    } catch (error) {
      console.error('Error optimizing code:', error);
      setError('Error al optimizar el código');
    } finally {
      setOptimizing(false);
    }
  };

  // Función para validar código
  const handleValidateCode = async () => {
    if (!currentDiagram) return;

    setValidating(true);
    try {
      const result = await validateMermaidCode(currentDiagram.mermaidCode);
      setValidationResult(result);
      
      toast({
        title: result.isValid ? "Código válido" : "Código con errores",
        description: result.isValid ? "El diagrama es sintácticamente correcto" : "Se encontraron errores en el código",
        variant: result.isValid ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error validating code:', error);
      setError('Error al validar el código');
    } finally {
      setValidating(false);
    }
  };

  // Función para generar variaciones
  const handleGenerateVariations = async () => {
    if (!currentDiagram) return;

    setGeneratingVariations(true);
    try {
      const result = await generateMermaidVariations(
        currentDiagram.mermaidCode,
        ['style', 'layout', 'complexity']
      );
      setVariations(result);
      
      toast({
        title: "Variaciones generadas",
        description: `Se crearon ${result.length} variaciones del diagrama`,
      });
    } catch (error) {
      console.error('Error generating variations:', error);
      setError('Error al generar variaciones');
    } finally {
      setGeneratingVariations(false);
    }
  };

  // Función para copiar código
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Código copiado",
        description: "El código Mermaid ha sido copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying code:', error);
    }
  };

  // Función para descargar código
  const handleDownloadCode = (code: string, filename: string = 'diagram.mmd') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Archivo descargado",
      description: `El archivo ${filename} ha sido descargado`,
    });
  };

  // Función para usar prompt de ejemplo
  const handleUseExample = (example: typeof examplePrompts[0]) => {
    setUserPrompt(example.prompt);
    setDiagramType(example.type);
  };

  // Función para corregir redacción del prompt
  const handleCorrectPrompt = async () => {
    if (!userPrompt.trim()) {
      setError('Por favor, escribe una descripción antes de corregir');
      return;
    }

    setCorrectingPrompt(true);
    setError('');

    try {
      const correctedPrompt = await correctPromptWriting(userPrompt);
      setUserPrompt(correctedPrompt);
      
      toast({
        title: "Redacción corregida",
        description: "El prompt ha sido mejorado exitosamente",
      });
    } catch (error) {
      console.error('Error correcting prompt:', error);
      setError(error instanceof Error ? error.message : 'Error al corregir la redacción');
    } finally {
       setCorrectingPrompt(false);
     }
   };

  // Función para descargar imagen del diagrama
  const handleDownloadImage = async () => {
    if (!currentDiagram) return;

    setDownloadingImage(true);
    try {
      // Obtener el elemento SVG del diagrama
      const diagramElement = document.getElementById('mermaid-diagram');
      if (!diagramElement) {
        throw new Error('No se encontró el diagrama para descargar');
      }

      const svgElement = diagramElement.querySelector('svg');
      if (!svgElement) {
        throw new Error('No se encontró el elemento SVG del diagrama');
      }

      // Clonar el SVG para no afectar el original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Asegurar que el SVG tenga las dimensiones correctas
      const bbox = svgElement.getBBox();
      const width = bbox.width + 40; // Agregar padding
      const height = bbox.height + 40;
      
      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());
      clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
      
      // Agregar estilos CSS inline para asegurar que se mantengan
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = `
        .node rect, .node circle, .node ellipse, .node polygon {
          fill: #f9f9f9;
          stroke: #333;
          stroke-width: 1px;
        }
        .edgePath path {
          stroke: #333;
          stroke-width: 1.5px;
          fill: none;
        }
        .edgeLabel {
          background-color: white;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }
        text {
          font-family: Arial, sans-serif;
          font-size: 14px;
          fill: #333;
        }
      `;
      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

      // Agregar fondo blanco al SVG
      const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      backgroundRect.setAttribute('width', '100%');
      backgroundRect.setAttribute('height', '100%');
      backgroundRect.setAttribute('fill', 'white');
      
      // Insertar después del primer elemento (style) si existe
      const firstChild = clonedSvg.firstChild;
      if (firstChild && firstChild.nextSibling) {
        clonedSvg.insertBefore(backgroundRect, firstChild.nextSibling);
      } else {
        clonedSvg.appendChild(backgroundRect);
      }

      // Convertir SVG a string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      
      // Descargar directamente como SVG (más confiable)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDiagram.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Imagen descargada",
        description: "El diagrama se ha descargado como archivo SVG",
      });
      
    } catch (error) {
      console.error('Error downloading image:', error);
      setError(error instanceof Error ? error.message : 'Error al descargar la imagen');
    } finally {
      setDownloadingImage(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generador de Gráficos Mermaid</h1>
        <p className="text-gray-600">
          Crea diagramas profesionales usando inteligencia artificial. Describe lo que necesitas y obtén código Mermaid listo para usar.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generador</TabsTrigger>
          <TabsTrigger value="viewer">Visualizador</TabsTrigger>
          <TabsTrigger value="code">Código</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Tab Generador */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal de generación */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Crear Diagrama
                  </CardTitle>
                  <CardDescription>
                    Describe el diagrama que quieres crear y la IA generará el código Mermaid correspondiente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="user-prompt">Descripción del Diagrama</Label>
                    <Textarea
                      id="user-prompt"
                      placeholder="Ejemplo: Crea un diagrama de flujo que muestre el proceso de registro de usuarios, incluyendo validación de email, verificación de datos y confirmación..."
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Sé específico sobre el tipo de diagrama, elementos a incluir y relaciones entre ellos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Diagrama (Opcional)</Label>
                      <Select value={diagramType} onValueChange={setDiagramType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Detección automática" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Detección automática</SelectItem>
                          {diagramTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{type.label}</span>
                                <span className="text-xs text-gray-500">{type.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Nivel de Complejidad</Label>
                      <Select value={complexity} onValueChange={(value: 'simple' | 'medium' | 'complex') => setComplexity(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (3-5 elementos)</SelectItem>
                          <SelectItem value="medium">Medio (6-12 elementos)</SelectItem>
                          <SelectItem value="complex">Complejo (13+ elementos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCorrectPrompt}
                      disabled={correctingPrompt || !userPrompt.trim()}
                      variant="outline"
                      className="flex-1"
                    >
                      {correctingPrompt ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Corrigiendo...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Corregir Redacción
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleGenerateDiagram}
                      disabled={loading || !userPrompt.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando diagrama...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generar Diagrama
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel de ejemplos */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Ejemplos
                  </CardTitle>
                  <CardDescription>
                    Usa estos ejemplos como punto de partida
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {examplePrompts.map((example, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                         onClick={() => handleUseExample(example)}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{example.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {diagramTypes.find(t => t.value === example.type)?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {example.prompt}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Visualizador */}
        <TabsContent value="viewer" className="space-y-6">
          {currentDiagram ? (
            <div className="space-y-6">
              {/* Información del diagrama */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentDiagram.title}</CardTitle>
                      <CardDescription>{currentDiagram.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {diagramTypes.find(t => t.value === currentDiagram.diagramType)?.label || currentDiagram.diagramType}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCode(!showCode)}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        {showCode ? 'Ocultar' : 'Ver'} Código
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showCode ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Código Mermaid</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyCode(currentDiagram.mermaidCode)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadCode(currentDiagram.mermaidCode)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{currentDiagram.mermaidCode}</code>
                      </pre>
                    </div>
                  ) : (
                    <MermaidViewer 
                      code={currentDiagram.mermaidCode} 
                      title={currentDiagram.title}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Herramientas del diagrama */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Herramientas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleOptimizeCode}
                      disabled={optimizing}
                    >
                      {optimizing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Optimizar
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleValidateCode}
                      disabled={validating}
                    >
                      {validating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Validar
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleGenerateVariations}
                      disabled={generatingVariations}
                    >
                      {generatingVariations ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Variaciones
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleDownloadImage}
                      disabled={downloadingImage}
                    >
                      {downloadingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Descargar Imagen
                    </Button>
                  </div>

                  {/* Resultado de validación */}
                  {validationResult && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                      validationResult.isValid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`flex items-center mb-2 ${
                        validationResult.isValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {validationResult.isValid ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-medium">
                          {validationResult.isValid ? 'Código válido' : 'Errores encontrados'}
                        </span>
                      </div>
                      
                      {validationResult.errors.length > 0 && (
                        <div className="mb-2">
                          <h5 className="font-medium text-sm mb-1">Errores:</h5>
                          <ul className="text-sm space-y-1">
                            {validationResult.errors.map((error: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-500 mr-2">•</span>
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.suggestions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1">Sugerencias:</h5>
                          <ul className="text-sm space-y-1">
                            {validationResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variaciones */}
                  {variations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-3">Variaciones del Diagrama</h4>
                      <div className="space-y-3">
                        {variations.map((variation, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">Variación {index + 1}</span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newDiagram: MermaidDiagramResult = {
                                      ...currentDiagram,
                                      mermaidCode: variation,
                                      title: `${currentDiagram.title} - Variación ${index + 1}`
                                    };
                                    setCurrentDiagram(newDiagram);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Usar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyCode(variation)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                            </div>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              <code>{variation}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sugerencias */}
              {currentDiagram.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Sugerencias de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentDiagram.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2 mt-1">•</span>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay diagrama generado</h3>
                <p className="text-gray-600 mb-4">
                  Ve a la pestaña &quot;Generador&quot; para crear tu primer diagrama Mermaid.
                </p>
                <Button onClick={() => setActiveTab('generator')}>
                  Crear Diagrama
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Código */}
        <TabsContent value="code" className="space-y-6">
          {currentDiagram ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Código Mermaid</CardTitle>
                    <CardDescription>{currentDiagram.title}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCopyCode(currentDiagram.mermaidCode)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadCode(currentDiagram.mermaidCode)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm border">
                    <code>{currentDiagram.mermaidCode}</code>
                  </pre>
                  
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>Tipo:</strong> {currentDiagram.diagramType}</p>
                    <p><strong>Descripción:</strong> {currentDiagram.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay código disponible</h3>
                <p className="text-gray-600 mb-4">
                  Genera un diagrama primero para ver su código Mermaid.
                </p>
                <Button onClick={() => setActiveTab('generator')}>
                  Crear Diagrama
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Historial */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Historial de Diagramas</h2>
            {diagramHistory.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setDiagramHistory([])}
              >
                Limpiar Historial
              </Button>
            )}
          </div>

          {diagramHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay diagramas en el historial</h3>
                <p className="text-gray-600 mb-4">
                  Los diagramas que generes aparecerán aquí para que puedas acceder a ellos fácilmente.
                </p>
                <Button onClick={() => setActiveTab('generator')}>
                  Crear Primer Diagrama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diagramHistory.map((diagram, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentDiagram(diagram);
                        setActiveTab('viewer');
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{diagram.title}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {diagram.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {diagram.diagramType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Clic para ver</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(diagram.mermaidCode);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCode(diagram.mermaidCode, `${diagram.title.toLowerCase().replace(/\s+/g, '-')}.mmd`);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}