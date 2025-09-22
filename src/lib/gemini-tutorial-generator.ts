import { GoogleGenAI } from "@google/genai";
import { generateTutorialPdf } from './tutorial-pdf-generator';

export interface TutorialConfig {
  topic: string;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  tutorialType: 'step-by-step' | 'conceptual' | 'practical' | 'comprehensive';
  length: 'short' | 'medium' | 'long';
  includeExamples: boolean;
  includeExercises: boolean;
  includeResources: boolean;
  style: 'formal' | 'casual' | 'technical' | 'educational';
  language: 'spanish' | 'english';
  format: 'markdown' | 'structured';
}

export interface TutorialSection {
  title: string;
  content: string;
  subsections?: TutorialSection[];
  examples?: string[];
  exercises?: string[];
  resources?: string[];
}

export interface TutorialResult {
  title: string;
  description: string;
  sections: TutorialSection[];
  markdownContent: string;
  metadata: {
    estimatedReadTime: string;
    difficulty: string;
    prerequisites: string[];
    learningObjectives: string[];
  };
}

export interface TutorialOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  improvements: string[];
  reasoning: string;
}

/**
 * Genera un tutorial completo usando Google Gemini basado en la configuración proporcionada
 * @param config - Configuración del tutorial
 * @returns Resultado con el tutorial generado
 */
export async function generateTutorial(config: TutorialConfig, apiKey?: string): Promise<TutorialResult> {
  try {
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    // Construir el prompt basado en la configuración
    const prompt = buildTutorialPrompt(config);

    const result = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = result.text;
    if (!text) {
      throw new Error('No se recibió respuesta del modelo');
    }

    // Parsear la respuesta para extraer las secciones
    const parsedTutorial = parseTutorialResponse(text, config);
    
    return parsedTutorial;
  } catch (error) {
    console.error('Error generating tutorial:', error);
    throw new Error(`Error al generar el tutorial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Optimiza un tutorial existente
 * @param existingContent - Contenido del tutorial existente
 * @param optimizationGoals - Objetivos de optimización
 * @returns Resultado con el tutorial optimizado
 */
export async function optimizeTutorial(
  existingContent: string,
  optimizationGoals: string[]
, apiKey?: string): Promise<TutorialOptimizationResult> {
  try {
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const prompt = `
Como experto en creación de contenido educativo, optimiza el siguiente tutorial basándote en estos objetivos:

Objetivos de optimización:
${optimizationGoals.map(goal => `- ${goal}`).join('\n')}

Tutorial a optimizar:
${existingContent}

Por favor, proporciona:
1. El contenido optimizado
2. Lista de mejoras implementadas
3. Explicación del razonamiento detrás de los cambios

Formato de respuesta:
---OPTIMIZED_CONTENT---
[contenido optimizado aquí]
---IMPROVEMENTS---
[lista de mejoras]
---REASONING---
[explicación del razonamiento]
`;

    const result = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const response = result.text;
    if (!response) {
      throw new Error('No se recibió respuesta del modelo');
    }
    
    // Parsear la respuesta
    const optimizedMatch = response.match(/---OPTIMIZED_CONTENT---([\s\S]*?)---IMPROVEMENTS---/);
    const improvementsMatch = response.match(/---IMPROVEMENTS---([\s\S]*?)---REASONING---/);
    const reasoningMatch = response.match(/---REASONING---([\s\S]*?)$/);

    return {
      originalContent: existingContent,
      optimizedContent: optimizedMatch?.[1]?.trim() || existingContent,
      improvements: improvementsMatch?.[1]?.trim().split('\n').filter(line => line.trim()) || [],
      reasoning: reasoningMatch?.[1]?.trim() || 'No se proporcionó razonamiento'
    };
  } catch (error) {
    console.error('Error optimizing tutorial:', error);
    throw new Error(`Error al optimizar el tutorial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera variaciones de un tutorial
 * @param baseTutorial - Tutorial base
 * @param variationTypes - Tipos de variaciones a generar
 * @returns Array de variaciones del tutorial
 */
export async function generateTutorialVariations(
  baseTutorial: string,
  variationTypes: string[] = ['audience', 'style', 'format']
, apiKey?: string): Promise<string[]> {
  try {
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const variations: string[] = [];

    for (const variationType of variationTypes) {
      const prompt = `
Crea una variación del siguiente tutorial enfocándote en: ${variationType}

Tutorial base:
${baseTutorial}

Instrucciones para la variación "${variationType}":
${getVariationInstructions(variationType)}

Proporciona solo el contenido de la variación:
`;

      const result = await genAI.models.generateContent({
        model: model,
        contents: prompt
      });

      variations.push(result.text || '');
    }

    return variations;
  } catch (error) {
    console.error('Error generating tutorial variations:', error);
    throw new Error(`Error al generar variaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Valida la estructura y contenido de un tutorial
 * @param tutorialContent - Contenido del tutorial a validar
 * @returns Resultado de la validación
 */
export async function validateTutorial(
  tutorialContent: string
, apiKey?: string): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
  try {
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const prompt = `
Como experto en diseño instruccional, evalúa la calidad del siguiente tutorial:

${tutorialContent}

Analiza:
1. Estructura y organización
2. Claridad del contenido
3. Progresión lógica
4. Completitud de la información
5. Calidad pedagógica

Proporciona:
- Lista de problemas encontrados
- Sugerencias de mejora
- Evaluación general (válido/necesita mejoras)

Formato:
---ISSUES---
[lista de problemas]
---SUGGESTIONS---
[lista de sugerencias]
---VALID---
[true/false]
`;

    const result = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const response = result.text;
    if (!response) {
      throw new Error('No se recibió respuesta del modelo');
    }
    
    const issuesMatch = response.match(/---ISSUES---([\s\S]*?)---SUGGESTIONS---/);
    const suggestionsMatch = response.match(/---SUGGESTIONS---([\s\S]*?)---VALID---/);
    const validMatch = response.match(/---VALID---([\s\S]*?)$/);

    const issues = issuesMatch?.[1]?.trim().split('\n').filter(line => line.trim()) || [];
    const suggestions = suggestionsMatch?.[1]?.trim().split('\n').filter(line => line.trim()) || [];
    const isValid = validMatch?.[1]?.trim().toLowerCase() === 'true';

    return { isValid, issues, suggestions };
  } catch (error) {
    console.error('Error validating tutorial:', error);
    return {
      isValid: false,
      issues: ['Error al validar el tutorial'],
      suggestions: ['Intenta validar nuevamente']
    };
  }
}

/**
 * Exporta el tutorial como PDF
 * @param tutorial - Tutorial a exportar
 * @param filename - Nombre del archivo
 * @returns Buffer del PDF generado
 */
export async function exportTutorialAsPDF(
  tutorial: TutorialResult
, apiKey?: string): Promise<Uint8Array> {
  try {
    const doc = generateTutorialPdf(tutorial, {
      includeMetadata: true,
      includeTableOfContents: true,
      pageFormat: 'a4',
      margins: { top: 20, right: 15, bottom: 20, left: 15 }
    });
    
    // Usar el método correcto de jsPDF para obtener el buffer
    const pdfBytes = doc.output('arraybuffer');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error exporting tutorial as PDF:', error);
    throw new Error(`Error al exportar como PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Corrige la redacción de un prompt para tutorial
 * @param prompt - Prompt a corregir
 * @returns Prompt corregido
 */
export async function correctTutorialPrompt(prompt: string, apiKey?: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const correctionPrompt = `
Como experto en redacción educativa, mejora la siguiente descripción para un tutorial:

"${prompt}"

Mejora:
- Claridad y precisión
- Estructura y organización
- Terminología apropiada
- Objetivos de aprendizaje claros

Proporciona solo la versión mejorada:
`;

    const result = await genAI.models.generateContent({
      model: model,
      contents: correctionPrompt
    });

    return result.text?.trim() || '';
  } catch (error) {
    console.error('Error correcting tutorial prompt:', error);
    throw new Error(`Error al corregir el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Funciones auxiliares

function buildTutorialPrompt(config: TutorialConfig): string {
  const languageInstructions = config.language === 'spanish' 
    ? 'Responde en español' 
    : 'Respond in English';

  const audienceLevel = {
    'beginner': 'principiante (sin conocimientos previos)',
    'intermediate': 'intermedio (conocimientos básicos)',
    'advanced': 'avanzado (conocimientos sólidos)'
  }[config.targetAudience];

  const tutorialTypeInstructions = {
    'step-by-step': 'tutorial paso a paso con instrucciones detalladas',
    'conceptual': 'tutorial conceptual que explique teoría y fundamentos',
    'practical': 'tutorial práctico con ejercicios y ejemplos',
    'comprehensive': 'tutorial completo que combine teoría y práctica'
  }[config.tutorialType];

  const lengthInstructions = {
    'short': '1000-2000 palabras',
    'medium': '2000-4000 palabras',
    'long': '4000-8000 palabras'
  }[config.length];

  return `
${languageInstructions}.

Crea un ${tutorialTypeInstructions} sobre "${config.topic}" para audiencia de nivel ${audienceLevel}.

Especificaciones:
- Longitud: ${lengthInstructions}
- Estilo: ${config.style}
- ${config.includeExamples ? 'Incluir ejemplos prácticos' : 'Sin ejemplos específicos'}
- ${config.includeExercises ? 'Incluir ejercicios y actividades' : 'Sin ejercicios'}
- ${config.includeResources ? 'Incluir recursos adicionales y referencias' : 'Sin recursos adicionales'}

Estructura requerida:
1. Título atractivo
2. Descripción breve
3. Objetivos de aprendizaje
4. Prerrequisitos
5. Contenido principal organizado en secciones
6. ${config.includeExamples ? 'Ejemplos prácticos en cada sección' : ''}
7. ${config.includeExercises ? 'Ejercicios de práctica' : ''}
8. ${config.includeResources ? 'Recursos adicionales' : ''}
9. Conclusión
10. Tiempo estimado de lectura

Formato de respuesta:
---TITLE---
[título del tutorial]
---DESCRIPTION---
[descripción breve]
---OBJECTIVES---
[objetivos de aprendizaje]
---PREREQUISITES---
[prerrequisitos]
---CONTENT---
[contenido principal en markdown]
---READ_TIME---
[tiempo estimado]
`;
}

function parseTutorialResponse(response: string, config: TutorialConfig): TutorialResult {
  const titleMatch = response.match(/---TITLE---([\s\S]*?)---DESCRIPTION---/);
  const descriptionMatch = response.match(/---DESCRIPTION---([\s\S]*?)---OBJECTIVES---/);
  const objectivesMatch = response.match(/---OBJECTIVES---([\s\S]*?)---PREREQUISITES---/);
  const prerequisitesMatch = response.match(/---PREREQUISITES---([\s\S]*?)---CONTENT---/);
  const contentMatch = response.match(/---CONTENT---([\s\S]*?)---READ_TIME---/);
  const readTimeMatch = response.match(/---READ_TIME---([\s\S]*?)$/);

  const title = titleMatch?.[1]?.trim() || config.topic;
  const description = descriptionMatch?.[1]?.trim() || '';
  const objectives = objectivesMatch?.[1]?.trim().split('\n').filter(line => line.trim()) || [];
  const prerequisites = prerequisitesMatch?.[1]?.trim().split('\n').filter(line => line.trim()) || [];
  const markdownContent = contentMatch?.[1]?.trim() || '';
  const readTime = readTimeMatch?.[1]?.trim() || '10-15 minutos';

  // Parsear secciones del contenido markdown
  const sections = parseMarkdownSections(markdownContent);

  return {
    title,
    description,
    sections,
    markdownContent,
    metadata: {
      estimatedReadTime: readTime,
      difficulty: config.targetAudience,
      prerequisites,
      learningObjectives: objectives
    }
  };
}

function parseMarkdownSections(markdown: string): TutorialSection[] {
  const sections: TutorialSection[] = [];
  const lines = markdown.split('\n');
  let currentSection: TutorialSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('# ') || line.startsWith('## ')) {
      // Guardar sección anterior si existe
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      
      // Crear nueva sección
      currentSection = {
        title: line.replace(/^#+\s/, ''),
        content: ''
      };
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Agregar última sección
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function getVariationInstructions(variationType: string): string {
  const instructions: { [key: string]: string } = {
    'audience': 'Adapta el contenido para una audiencia diferente (cambia el nivel de complejidad y terminología)',
    'style': 'Cambia el estilo de escritura (formal/casual/técnico/educativo)',
    'format': 'Reorganiza la estructura y formato del contenido',
    'length': 'Ajusta la longitud del contenido (más conciso o más detallado)',
    'focus': 'Cambia el enfoque principal del tutorial (teórico/práctico/conceptual)'
  };

  return instructions[variationType] || 'Crea una variación general del contenido';
}