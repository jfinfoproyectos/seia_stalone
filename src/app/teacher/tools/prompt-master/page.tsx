'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Sparkles, RefreshCw, Lightbulb, FileText, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateOptimizedPrompt } from '@/lib/gemini-prompt-generator';

interface PromptSuggestion {
  type: string;
  technique: string;
  reason: string;
}

interface GeneratedPrompt {
  id: string;
  prompt: string;
  explanation: string;
  suggestions: PromptSuggestion[];
  testExample: string;
  timestamp: string;
}

const promptTypes = [
  { value: 'open', label: 'Abierto', description: 'Para exploración creativa' },
  { value: 'closed', label: 'Cerrado', description: 'Para respuestas precisas' },
  { value: 'instruction', label: 'Instrucción', description: 'Para tareas específicas' },
  { value: 'context', label: 'Contexto/Rol', description: 'Asigna un rol específico' },
  { value: 'chain', label: 'Cadena de Pensamiento', description: 'Razonamiento paso a paso' },
  { value: 'few-shot', label: 'Few-Shot', description: 'Incluye ejemplos' },
  { value: 'zero-shot', label: 'Zero-Shot', description: 'Directo sin ejemplos' },
  { value: 'creative', label: 'Creativo', description: 'Para arte o ideas innovadoras' },
  { value: 'conversational', label: 'Conversacional', description: 'Para diálogos' },
  { value: 'iterative', label: 'Iterativo', description: 'Para refinamientos' }
];

const techniques = [
  { value: 'specificity', label: 'Especificidad', description: 'Añade detalles como longitud, tono, formato' },
  { value: 'context', label: 'Contexto', description: 'Incluye antecedentes o público objetivo' },
  { value: 'examples', label: 'Ejemplos', description: 'Usa few-shot para guiar el estilo' },
  { value: 'role', label: 'Rol', description: 'Define una perspectiva específica' },
  { value: 'constraints', label: 'Restricciones', description: 'Limita longitud, evita ciertos elementos' },
  { value: 'reasoning', label: 'Razonamiento Explícito', description: 'Pide &quot;explica paso a paso&quot;' },
  { value: 'iteration', label: 'Iteración', description: 'Sugiere cómo refinar' },
  { value: 'natural', label: 'Lenguaje Natural', description: 'Hazlo conversacional' },
  { value: 'keywords', label: 'Palabras Clave', description: 'Enfoca con términos específicos' },
  { value: 'testing', label: 'Prueba y Error', description: 'Ofrece variantes' }
];

export default function PromptMasterPanel() {
  const [userRequest, setUserRequest] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  const handleTechniqueToggle = (technique: string) => {
    setSelectedTechniques(prev => 
      prev.includes(technique) 
        ? prev.filter(t => t !== technique)
        : [...prev, technique]
    );
  };

  const generatePrompt = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!userRequest.trim()) {
      alert('Por favor, describe lo que quieres lograr con el prompt.');
      return;
    }
    
    if (!selectedType) {
      alert('Por favor, selecciona un tipo de prompt.');
      return;
    }
    
    setLoading(true);
    try {
      // Generar prompt usando el servicio de Gemini
      const geminiResult = await generateOptimizedPrompt(
        userRequest,
        selectedType,
        selectedTechniques
      );
      
      console.log('Gemini result:', geminiResult);
      
      const newPrompt: GeneratedPrompt = {
        id: Date.now().toString(),
        prompt: geminiResult.prompt || 'Prompt no disponible',
        explanation: geminiResult.explanation || 'Explicación no disponible',
        suggestions: Array.isArray(geminiResult.suggestions) ? geminiResult.suggestions : [],
        testExample: geminiResult.testExample || 'Ejemplo no disponible',
        timestamp: new Date().toLocaleString()
      };
      
      setGeneratedPrompts(prev => [newPrompt, ...prev]);
      setActiveTab('history');
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Mostrar error al usuario
      alert('Error al generar el prompt. Por favor, verifica tu conexión y que tengas configurada la API key de Gemini.');
    } finally {
      setLoading(false);
    }
  };



  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const clearHistory = () => {
    setGeneratedPrompts([]);
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-full px-2 md:px-8 py-8 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PromptMaster
              </h1>
              <p className="text-muted-foreground">
                Herramienta interactiva para crear prompts personalizados para modelos de IA
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'generator'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generador
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
            Historial ({generatedPrompts.length})
          </button>
        </div>

        {activeTab === 'generator' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel de Configuración */}
            <div className="w-full lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Configuración del Prompt
                </CardTitle>
                <CardDescription>
                  Describe lo que quieres lograr y selecciona las técnicas apropiadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="request">¿Qué quieres lograr con el prompt?</Label>
                  <Textarea
                    id="request"
                    placeholder="Ej: generar ideas de negocio, crear contenido educativo, analizar datos, resolver problemas..."
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tipo de Prompt</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona un tipo de prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Técnicas a Aplicar</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {techniques.map((technique) => (
                      <Tooltip key={technique.value}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={selectedTechniques.includes(technique.value) ? 'default' : 'outline'}
                            className="cursor-pointer justify-start p-2 h-auto"
                            onClick={() => handleTechniqueToggle(technique.value)}
                          >
                            {technique.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{technique.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Seleccionadas: {selectedTechniques.length} técnicas
                  </p>
                </div>

                <Button 
                  type="button"
                  onClick={generatePrompt}
                  disabled={!userRequest.trim() || !selectedType || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando con Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Prompt con IA
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
                  <MessageSquare className="h-5 w-5" />
                  Guía Rápida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Consejo:</strong> Sé específico sobre tu objetivo. En lugar de &quot;ayuda con marketing&quot;, 
                      prueba &quot;crear estrategias de marketing digital para pequeñas empresas&quot;.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold mb-2">Tipos de Prompts Populares:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>Instrucción:</strong> Para tareas específicas</li>
                      <li>• <strong>Contexto/Rol:</strong> Asigna expertise</li>
                      <li>• <strong>Cadena de Pensamiento:</strong> Para análisis profundo</li>
                      <li>• <strong>Few-Shot:</strong> Cuando necesitas ejemplos</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Técnicas Recomendadas:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>Especificidad:</strong> Define formato y longitud</li>
                      <li>• <strong>Contexto:</strong> Proporciona antecedentes</li>
                      <li>• <strong>Restricciones:</strong> Establece límites claros</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold">Historial de Prompts</h2>
              {generatedPrompts.length > 0 && (
                <Button variant="outline" onClick={clearHistory} size="sm">
                  Limpiar Historial
                </Button>
              )}
            </div>

            {generatedPrompts.length === 0 ? (
              <div className="border rounded-lg p-8 bg-background/80 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay prompts generados</h3>
                <p className="text-muted-foreground mb-4">
                  Genera tu primer prompt usando el generador
                </p>
                <Button onClick={() => setActiveTab('generator')}>
                  Ir al Generador
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedPrompts.map((prompt) => (
                  <div key={prompt.id} className="border rounded-lg p-4 bg-background/80">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Prompt Generado</h3>
                        <p className="text-sm text-muted-foreground">{prompt.timestamp}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                      >
                        {copiedId === prompt.id ? (
                          'Copiado!'
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Prompt:</Label>
                          <div className="bg-muted p-3 rounded-md mt-2">
                            <p className="text-sm font-mono whitespace-pre-wrap">{typeof prompt.prompt === 'string' ? prompt.prompt : 'Error: Formato de prompt inválido'}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold">Explicación:</Label>
                          <p className="text-sm text-muted-foreground mt-1">{prompt.explanation || 'No disponible'}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold">Ejemplo de Uso:</Label>
                          <p className="text-sm text-muted-foreground mt-1">{prompt.testExample || 'No disponible'}</p>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-semibold">Técnicas Aplicadas:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {prompt.suggestions && Array.isArray(prompt.suggestions) ? prompt.suggestions.map((suggestion, idx) => (
                              <Badge key={idx} variant="secondary">
                                {typeof suggestion === 'object' && suggestion.technique ? suggestion.technique : String(suggestion)}
                              </Badge>
                            )) : (
                              <p className="text-sm text-muted-foreground">No hay técnicas disponibles</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}