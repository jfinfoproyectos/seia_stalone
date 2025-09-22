import { GoogleGenAI } from "@google/genai";
import { getApiKey } from './apiKeyService';

export interface MermaidDiagramResult {
  mermaidCode: string;
  title: string;
  description: string;
  diagramType: string;
  suggestions: string[];
  alternatives?: string[];
}

export interface MermaidOptimizationResult {
  originalCode: string;
  optimizedCode: string;
  improvements: string[];
  reasoning: string;
}

/**
 * Genera código Mermaid usando Google Gemini basado en la descripción del usuario
 * @param userPrompt - Descripción del gráfico que el usuario quiere crear
 * @param diagramType - Tipo de diagrama preferido (opcional)
 * @param complexity - Nivel de complejidad deseado
 * @returns Resultado con el código Mermaid generado
 */
export async function generateMermaidDiagram(
  userPrompt: string,
  diagramType?: string,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): Promise<MermaidDiagramResult> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    // Mapeo de tipos de diagrama disponibles
    const diagramTypes = {
      'flowchart': 'Diagrama de flujo para procesos y decisiones',
      'sequence': 'Diagrama de secuencia para interacciones temporales',
      'class': 'Diagrama de clases para estructuras de datos',
      'state': 'Diagrama de estados para máquinas de estado',
      'er': 'Diagrama entidad-relación para bases de datos',
      'gantt': 'Diagrama de Gantt para planificación de proyectos',
      'pie': 'Gráfico circular para mostrar proporciones',
      'journey': 'Diagrama de viaje del usuario',
      'gitgraph': 'Diagrama de ramas de Git',
      'mindmap': 'Mapa mental para organizar ideas',
      'timeline': 'Línea de tiempo para eventos cronológicos'
    };

    const complexityLevels = {
      'simple': 'Diagrama básico con pocos elementos (3-5 nodos)',
      'medium': 'Diagrama moderado con elementos suficientes (6-12 nodos)',
      'complex': 'Diagrama detallado con muchos elementos (13+ nodos)'
    };

    const systemPrompt = `
Eres un experto en la creación de diagramas Mermaid. Tu tarea es generar código Mermaid válido y bien estructurado basado en las descripciones del usuario.

TIPOS DE DIAGRAMAS DISPONIBLES:
${Object.entries(diagramTypes).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

NIVELES DE COMPLEJIDAD:
- simple: ${complexityLevels.simple}
- medium: ${complexityLevels.medium}
- complex: ${complexityLevels.complex}

INSTRUCCIONES:
1. Analiza la descripción del usuario para determinar el tipo de diagrama más apropiado
2. Genera código Mermaid válido y sintácticamente correcto
3. Usa nombres descriptivos para nodos y elementos
4. Incluye colores y estilos cuando sea apropiado
5. Asegúrate de que el diagrama sea claro y fácil de entender
6. Proporciona sugerencias para mejorar o expandir el diagrama

FORMATO DE RESPUESTA:
Debes responder ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "mermaidCode": "código mermaid completo",
  "title": "título descriptivo del diagrama",
  "description": "descripción breve de lo que representa",
  "diagramType": "tipo de diagrama utilizado",
  "suggestions": ["sugerencia 1", "sugerencia 2"],
  "alternatives": ["código alternativo 1", "código alternativo 2"]
}

DESCRIPCIÓN DEL USUARIO:
"${userPrompt}"

${diagramType ? `TIPO PREFERIDO: ${diagramType}` : 'TIPO: Determina automáticamente el más apropiado'}
COMPLEJIDAD: ${complexity} (${complexityLevels[complexity]})

Genera el diagrama Mermaid más apropiado para esta descripción.
`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: systemPrompt
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('No se recibió respuesta del modelo');
    }

    // Intentar parsear la respuesta JSON
    let result: MermaidDiagramResult;
    try {
      // Limpiar la respuesta si contiene markdown
      const cleanedResponse = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', responseText);
      
      // Fallback: crear resultado básico
      result = {
        mermaidCode: 'graph TD\n    A[Inicio] --> B[Proceso]\n    B --> C[Fin]',
        title: 'Diagrama Básico',
        description: 'Diagrama generado como fallback',
        diagramType: 'flowchart',
        suggestions: ['Proporciona más detalles para un mejor diagrama'],
        alternatives: []
      };
    }

    // Validar que el código Mermaid sea válido básicamente
    if (!result.mermaidCode || result.mermaidCode.trim().length === 0) {
      throw new Error('El código Mermaid generado está vacío');
    }

    return result;
  } catch (error) {
    console.error('Error generating Mermaid diagram:', error);
    throw new Error(`Error al generar diagrama: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Optimiza código Mermaid existente
 * @param existingCode - Código Mermaid actual
 * @param improvementGoals - Objetivos de mejora
 * @returns Código optimizado con explicaciones
 */
export async function optimizeMermaidCode(
  existingCode: string,
  improvementGoals: string[]
): Promise<MermaidOptimizationResult> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const optimizationPrompt = `
Eres un experto en diagramas Mermaid. Tu tarea es optimizar el código Mermaid existente según los objetivos de mejora especificados.

CÓDIGO MERMAID ACTUAL:
\`\`\`mermaid
${existingCode}
\`\`\`

OBJETIVOS DE MEJORA:
${improvementGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')}

INSTRUCCIONES:
1. Analiza el código actual e identifica áreas de mejora
2. Aplica las optimizaciones solicitadas
3. Mantén la funcionalidad original mientras mejoras la estructura
4. Asegúrate de que el código optimizado sea válido
5. Explica cada mejora realizada

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido:
{
  "originalCode": "código original",
  "optimizedCode": "código optimizado",
  "improvements": ["mejora 1", "mejora 2"],
  "reasoning": "explicación del proceso de optimización"
}
`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: optimizationPrompt
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('No se recibió respuesta del modelo');
    }

    // Parsear respuesta JSON
    const cleanedResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const result: MermaidOptimizationResult = JSON.parse(cleanedResponse);
    
    return result;
  } catch (error) {
    console.error('Error optimizing Mermaid code:', error);
    throw new Error(`Error al optimizar código: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Valida código Mermaid y proporciona sugerencias
 * @param mermaidCode - Código Mermaid a validar
 * @returns Resultado de validación con sugerencias
 */
export async function validateMermaidCode(
  mermaidCode: string
): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const validationPrompt = `
Eres un experto en sintaxis Mermaid. Analiza el siguiente código y determina si es válido.

CÓDIGO MERMAID:
\`\`\`mermaid
${mermaidCode}
\`\`\`

INSTRUCCIONES:
1. Verifica la sintaxis del código Mermaid
2. Identifica errores sintácticos o estructurales
3. Proporciona sugerencias de mejora
4. Considera las mejores prácticas de Mermaid

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido:
{
  "isValid": true/false,
  "errors": ["error 1", "error 2"],
  "suggestions": ["sugerencia 1", "sugerencia 2"]
}
`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: validationPrompt
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('No se recibió respuesta del modelo');
    }

    const cleanedResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const result = JSON.parse(cleanedResponse);
    
    return result;
  } catch (error) {
    console.error('Error validating Mermaid code:', error);
    return {
      isValid: false,
      errors: ['Error al validar el código'],
      suggestions: ['Verifica la sintaxis manualmente']
    };
  }
}

/**
 * Genera variaciones de un diagrama Mermaid
 * @param baseDiagram - Diagrama base
 * @param variationTypes - Tipos de variaciones deseadas
 * @returns Array de variaciones del diagrama
 */
export async function generateMermaidVariations(
  baseDiagram: string,
  variationTypes: string[] = ['style', 'layout', 'complexity']
): Promise<string[]> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const variationPrompt = `
Genera 3 variaciones del siguiente diagrama Mermaid, aplicando diferentes enfoques:

DIAGRAMA BASE:
\`\`\`mermaid
${baseDiagram}
\`\`\`

TIPOS DE VARIACIÓN:
${variationTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}

INSTRUCCIONES:
1. Mantén la estructura conceptual básica
2. Aplica diferentes estilos, layouts o niveles de detalle
3. Asegúrate de que cada variación sea válida
4. Haz que cada variación sea distintiva

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un array JSON de strings:
["variación 1", "variación 2", "variación 3"]
`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: variationPrompt
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('No se recibió respuesta del modelo');
    }

    const cleanedResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const variations: string[] = JSON.parse(cleanedResponse);
    
    return variations;
  } catch (error) {
    console.error('Error generating Mermaid variations:', error);
    return [];
  }
}

/**
 * Corrige la redacción de un prompt para generar diagramas Mermaid usando Gemini AI
 * @param prompt Prompt original a corregir
 * @returns Prompt corregido
 */
export async function correctPromptWriting(prompt: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error('El prompt no puede estar vacío');
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const correctionPrompt = `
Eres un experto en redacción y comunicación técnica. Tu tarea es corregir y mejorar la redacción del siguiente prompt para generar diagramas Mermaid.

PROMPT ORIGINAL:
"${prompt}"

INSTRUCCIONES:
1. Corrige errores ortográficos y gramaticales
2. Mejora la claridad y precisión del lenguaje
3. Mantén el significado e intención original
4. Usa un tono profesional y técnico apropiado
5. Asegúrate de que sea específico y actionable para generar diagramas
6. Conserva el idioma original del prompt
7. Optimiza para que sea claro qué tipo de diagrama se necesita

Responde ÚNICAMENTE con el prompt corregido, sin explicaciones adicionales ni formato especial.
`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: correctionPrompt
    });

    const correctedPrompt = response.text?.trim() || prompt;
    
    // Remover comillas si las agregó el modelo
    return correctedPrompt.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error al corregir redacción del prompt:', error);
    throw new Error(`Error al corregir redacción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}