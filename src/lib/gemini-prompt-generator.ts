import { GoogleGenAI } from "@google/genai";
import { getApiKey } from './apiKeyService';


export interface PromptSuggestion {
  type: string;
  technique: string;
  reason: string;
}

export interface GeneratedPromptResult {
  prompt: string;
  explanation: string;
  suggestions: PromptSuggestion[];
  testExample: string;
  alternatives?: string[]; // Prompts alternativos
  bestPractices?: string[]; // Mejores prácticas aplicadas
}

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  reasoning: string;
}

/**
 * Genera un prompt optimizado usando Google Gemini basado en la solicitud del usuario,
 * tipo de prompt y técnicas seleccionadas.
 * @param userRequest - Descripción de lo que el usuario quiere lograr
 * @param promptType - Tipo de prompt seleccionado
 * @param techniques - Array de técnicas a aplicar
 * @param context - Contexto adicional opcional
 * @returns Resultado con el prompt generado y análisis
 */
export async function generateOptimizedPrompt(
  userRequest: string,
  promptType: string,
  techniques: string[],
  context?: string
): Promise<GeneratedPromptResult> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    // Mapeo de tipos de prompt a descripciones
    const promptTypeDescriptions: Record<string, string> = {
      'open': 'Prompt abierto para exploración creativa y respuestas amplias',
      'closed': 'Prompt cerrado para respuestas precisas y específicas',
      'instruction': 'Prompt de instrucción para tareas específicas y directas',
      'context': 'Prompt con contexto/rol que asigna una perspectiva específica',
      'chain': 'Prompt de cadena de pensamiento para razonamiento paso a paso',
      'few-shot': 'Prompt few-shot que incluye ejemplos para guiar la respuesta',
      'zero-shot': 'Prompt zero-shot directo sin ejemplos previos',
      'creative': 'Prompt creativo para arte, ideas innovadoras y pensamiento lateral',
      'conversational': 'Prompt conversacional para diálogos y interacciones naturales',
      'iterative': 'Prompt iterativo para refinamientos y mejoras progresivas'
    };

    // Mapeo de técnicas a descripciones
    const techniqueDescriptions: Record<string, string> = {
      'specificity': 'Añadir detalles específicos como longitud, tono, formato y estructura',
      'context': 'Incluir antecedentes relevantes y definir el público objetivo',
      'examples': 'Usar ejemplos concretos para guiar el estilo y formato de respuesta',
      'role': 'Definir una perspectiva o rol específico para el modelo de IA',
      'constraints': 'Establecer límites claros sobre longitud, contenido y restricciones',
      'reasoning': 'Solicitar razonamiento explícito y explicación paso a paso',
      'iteration': 'Incluir instrucciones para refinamiento y mejora iterativa',
      'natural': 'Usar lenguaje natural y conversacional para mayor claridad',
      'keywords': 'Enfocar con palabras clave y términos específicos del dominio',
      'testing': 'Incluir variantes y opciones para prueba y experimentación'
    };

    const selectedTypeDescription = promptTypeDescriptions[promptType] || 'Prompt general';
    const selectedTechniquesDescriptions = techniques.map(t => techniqueDescriptions[t]).filter(Boolean);

    const prompt = `
    Eres un experto en ingeniería de prompts y diseño de instrucciones para modelos de IA. Tu tarea es crear un prompt optimizado y profesional.

    SOLICITUD DEL USUARIO:
    ${userRequest}

    TIPO DE PROMPT REQUERIDO:
    ${selectedTypeDescription}

    TÉCNICAS A APLICAR:
    ${selectedTechniquesDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

    ${context ? `CONTEXTO ADICIONAL:\n${context}\n` : ''}
    INSTRUCCIONES:
    1. Crea un prompt optimizado que incorpore el tipo seleccionado y las técnicas especificadas
    2. El prompt debe ser claro, específico y efectivo para lograr el objetivo del usuario
    3. Asegúrate de que el prompt sea práctico y pueda ser usado inmediatamente
    4. Incluye elementos que mejoren la calidad y precisión de las respuestas
    5. Considera las mejores prácticas de ingeniería de prompts

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "prompt": "El prompt optimizado completo listo para usar",
      "explanation": "Explicación clara de por qué este prompt es efectivo y cómo incorpora las técnicas seleccionadas",
      "suggestions": [
        {
          "type": "Categoría de la sugerencia",
          "technique": "Técnica específica aplicada",
          "reason": "Razón por la cual esta técnica mejora el prompt"
        }
      ],
      "testExample": "Ejemplo concreto de cómo usar este prompt con una entrada de muestra",
      "alternatives": ["Variante 1 del prompt", "Variante 2 del prompt"],
      "bestPractices": ["Práctica 1 aplicada", "Práctica 2 aplicada"]
    }
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = response.text || '';

    // Extraer el JSON de la respuesta
    console.log('Raw Gemini response:', text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        console.log('JSON match found:', jsonMatch[0]);
        const result = JSON.parse(jsonMatch[0]) as GeneratedPromptResult;
        console.log('Parsed result:', result);
        
        // Validar la estructura del resultado
        if (!result.prompt || !result.explanation) {
          console.warn('Missing required fields in Gemini response:', result);
        }
        
        // Asegurar que suggestions sea un array
        if (!Array.isArray(result.suggestions)) {
          console.warn('Suggestions is not an array, converting:', result.suggestions);
          result.suggestions = [];
        }
        
        return result;
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
        console.error('JSON string that failed to parse:', jsonMatch[0]);
        throw new Error('Error al procesar la respuesta de Gemini');
      }
    }

    throw new Error('No se pudo extraer el prompt generado de la respuesta de Gemini');
  } catch (error) {
    console.error('Error al generar prompt con Gemini:', error);
    throw new Error(`Error al generar prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Optimiza un prompt existente usando Google Gemini
 * @param existingPrompt - El prompt actual que se quiere mejorar
 * @param improvementGoals - Objetivos específicos de mejora
 * @returns Resultado con el prompt optimizado y análisis de mejoras
 */
export async function optimizeExistingPrompt(
  existingPrompt: string,
  improvementGoals: string[]
): Promise<PromptOptimizationResult> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const prompt = `
    Eres un experto en optimización de prompts para modelos de IA. Analiza y mejora el siguiente prompt.

    PROMPT ACTUAL:
    ${existingPrompt}

    OBJETIVOS DE MEJORA:
    ${improvementGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

    INSTRUCCIONES:
    1. Analiza el prompt actual e identifica áreas de mejora
    2. Crea una versión optimizada que aborde los objetivos especificados
    3. Mantén la intención original pero mejora la claridad, especificidad y efectividad
    4. Aplica las mejores prácticas de ingeniería de prompts
    5. Explica las mejoras realizadas

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "originalPrompt": "${existingPrompt.replace(/"/g, '\\"')}",
      "optimizedPrompt": "Versión mejorada del prompt",
      "improvements": ["Mejora 1 realizada", "Mejora 2 realizada"],
      "reasoning": "Explicación detallada del proceso de optimización y por qué las mejoras son efectivas"
    }
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = response.text || '';

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]) as PromptOptimizationResult;
        return result;
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
        throw new Error('Error al procesar la respuesta de Gemini');
      }
    }

    throw new Error('No se pudo extraer la optimización de la respuesta de Gemini');
  } catch (error) {
    console.error('Error al optimizar prompt con Gemini:', error);
    throw new Error(`Error al optimizar prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Analiza un prompt y proporciona sugerencias de mejora
 * @param promptToAnalyze - El prompt a analizar
 * @returns Array de sugerencias de mejora
 */
export async function analyzePromptQuality(
  promptToAnalyze: string
): Promise<{ score: number; suggestions: string[]; strengths: string[] }> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const prompt = `
    Eres un experto evaluador de prompts para modelos de IA. Analiza la calidad del siguiente prompt.

    PROMPT A ANALIZAR:
    ${promptToAnalyze}

    CRITERIOS DE EVALUACIÓN:
    - Claridad y especificidad
    - Estructura y organización
    - Completitud de la instrucción
    - Uso de técnicas efectivas
    - Potencial para generar respuestas útiles

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "score": número_entre_0_y_100,
      "suggestions": ["Sugerencia de mejora 1", "Sugerencia de mejora 2"],
      "strengths": ["Fortaleza 1 del prompt", "Fortaleza 2 del prompt"]
    }
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = response.text || '';

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return {
          score: result.score || 0,
          suggestions: result.suggestions || [],
          strengths: result.strengths || []
        };
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
        throw new Error('Error al procesar la respuesta de Gemini');
      }
    }

    throw new Error('No se pudo extraer el análisis de la respuesta de Gemini');
  } catch (error) {
    console.error('Error al analizar prompt con Gemini:', error);
    throw new Error(`Error al analizar prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera variaciones de un prompt para testing A/B
 * @param basePrompt - El prompt base
 * @param variationCount - Número de variaciones a generar (máximo 5)
 * @returns Array de variaciones del prompt
 */
export async function generatePromptVariations(
  basePrompt: string,
  variationCount: number = 3
): Promise<string[]> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const maxVariations = Math.min(variationCount, 5);

    const prompt = `
    Eres un experto en ingeniería de prompts. Crea ${maxVariations} variaciones del siguiente prompt base.

    PROMPT BASE:
    ${basePrompt}

    INSTRUCCIONES:
    1. Mantén la intención y objetivo original
    2. Varía el estilo, estructura y enfoque
    3. Cada variación debe ser única y potencialmente más efectiva
    4. Incluye diferentes técnicas de prompting en cada variación

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "variations": ["Variación 1", "Variación 2", "Variación 3"]
    }
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = response.text || '';

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return result.variations || [];
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
        throw new Error('Error al procesar la respuesta de Gemini');
      }
    }

    throw new Error('No se pudieron extraer las variaciones de la respuesta de Gemini');
  } catch (error) {
    console.error('Error al generar variaciones con Gemini:', error);
    throw new Error(`Error al generar variaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}