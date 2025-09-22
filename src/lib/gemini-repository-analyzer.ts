import { GoogleGenAI } from "@google/genai";


export interface RepositoryFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  language?: string;
  size: number;
  sha?: string;
}

export interface RepositoryDirectory {
  name: string;
  path: string;
  type: 'directory';
  children: (RepositoryFile | RepositoryDirectory)[];
}

export interface RepositoryStructure {
  name: string;
  fullName: string;
  description?: string;
  url: string;
  defaultBranch: string;
  files: RepositoryFile[];
  directories: RepositoryDirectory[];
  totalFiles: number;
  totalDirectories: number;
  languages: Record<string, number>;
  scannedAt: string;
}

export interface SelectedItem {
  path: string;
  type: 'file' | 'directory';
  name: string;
  selected: boolean;
}

export interface AnalysisResult {
  repositoryUrl: string;
  prompt: string;
  selectedItems: SelectedItem[];
  analysis: string;
  summary: string;
  recommendations: string[];
  score?: number;
  analyzedAt: string;
  itemsAnalyzed: number;
}

export interface AnalysisRequest {
  repositoryStructure: RepositoryStructure;
  selectedItems: SelectedItem[];
  customPrompt: string;
  includeContent: boolean;
}

/**
 * Obtiene la estructura completa de un repositorio de GitHub
 * @param repoUrl URL del repositorio (ej: "usuario/repositorio")
 * @param githubToken Token de GitHub (opcional)
 * @param branch Rama específica (por defecto: rama principal)
 * @returns Estructura completa del repositorio
 */
export async function getRepositoryStructure(
  repoUrl: string,
  githubToken?: string,
  branch?: string
): Promise<RepositoryStructure> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  try {
    // Obtener información del repositorio
    const repoResponse = await fetch(
      `https://api.github.com/repos/${repoUrl}`,
      { headers }
    );

    if (!repoResponse.ok) {
      throw new Error(`Error al obtener información del repositorio: ${repoResponse.status}`);
    }

    const repoInfo = await repoResponse.json();
    const defaultBranch = branch || repoInfo.default_branch;

    // Obtener el árbol completo del repositorio
    const treeResponse = await fetch(
      `https://api.github.com/repos/${repoUrl}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      throw new Error(`Error al obtener estructura del repositorio: ${treeResponse.status}`);
    }

    const treeData = await treeResponse.json();
    
    // Procesar archivos y directorios
    const files: RepositoryFile[] = [];
    const directories: RepositoryDirectory[] = [];
    const languages: Record<string, number> = {};
    let totalFiles = 0;
    let totalDirectories = 0;

    // Crear mapa de directorios para construir la jerarquía
    const directoryMap = new Map<string, RepositoryDirectory>();
    
    // Primero, crear todos los directorios
    for (const item of treeData.tree) {
      if (item.type === 'tree') {
        totalDirectories++;
        const directory: RepositoryDirectory = {
          name: item.path.split('/').pop() || '',
          path: item.path,
          type: 'directory',
          children: []
        };
        directoryMap.set(item.path, directory);
        
        // Si es un directorio de primer nivel, agregarlo a la lista principal
        if (!item.path.includes('/')) {
          directories.push(directory);
        }
      }
    }

    // Luego, procesar archivos y construir jerarquía
    for (const item of treeData.tree) {
      if (item.type === 'blob') {
        totalFiles++;
        const language = getLanguageFromExtension(item.path);
        languages[language] = (languages[language] || 0) + 1;
        
        const file: RepositoryFile = {
          name: item.path.split('/').pop() || '',
          path: item.path,
          content: '', // Se cargará bajo demanda
          type: 'file',
          language,
          size: item.size || 0,
          sha: item.sha
        };
        
        // Si es un archivo de primer nivel, agregarlo a la lista principal
        if (!item.path.includes('/')) {
          files.push(file);
        } else {
          // Encontrar el directorio padre y agregarlo
          const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
          const parentDir = directoryMap.get(parentPath);
          if (parentDir) {
            parentDir.children.push(file);
          }
        }
      }
    }

    // Construir jerarquía de directorios
    for (const [path, directory] of directoryMap) {
      if (path.includes('/')) {
        const parentPath = path.substring(0, path.lastIndexOf('/'));
        const parentDir = directoryMap.get(parentPath);
        if (parentDir) {
          parentDir.children.push(directory);
        }
      }
    }

    return {
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      url: repoInfo.html_url,
      defaultBranch,
      files,
      directories,
      totalFiles,
      totalDirectories,
      languages,
      scannedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al obtener estructura del repositorio:', error);
    throw new Error(`No se pudo obtener la estructura del repositorio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene el contenido de un archivo específico
 * @param repoUrl URL del repositorio
 * @param filePath Ruta del archivo
 * @param githubToken Token de GitHub (opcional)
 * @returns Contenido del archivo
 */
export async function getFileContent(
  repoUrl: string,
  filePath: string,
  githubToken?: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoUrl}/contents/${filePath}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error al obtener archivo: ${response.status}`);
    }

    const fileData = await response.json();
    
    if (fileData.type === 'file' && fileData.content) {
      // Decodificar contenido base64
      return decodeBase64Utf8(fileData.content);
    }
    
    return '';
  } catch (error) {
    console.error(`Error al obtener contenido del archivo ${filePath}:`, error);
    return '';
  }
}

/**
 * Obtiene el contenido de múltiples archivos seleccionados
 * @param repoUrl URL del repositorio
 * @param selectedItems Items seleccionados
 * @param githubToken Token de GitHub (opcional)
 * @returns Mapa de contenidos por ruta
 */
export async function getSelectedFilesContent(
  repoUrl: string,
  selectedItems: SelectedItem[],
  githubToken?: string
): Promise<Record<string, string>> {
  const contents: Record<string, string> = {};
  
  // Filtrar solo archivos seleccionados
  const selectedFiles = selectedItems.filter(item => item.type === 'file' && item.selected);
  
  for (const file of selectedFiles) {
    try {
      const content = await getFileContent(repoUrl, file.path, githubToken);
      contents[file.path] = content;
    } catch (error) {
      console.error(`Error al obtener contenido de ${file.path}:`, error);
      contents[file.path] = `Error al cargar contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  }
  
  return contents;
}

/**
 * Analiza elementos seleccionados de un repositorio usando Gemini AI
 * @param analysisRequest Solicitud de análisis
 * @param githubToken Token de GitHub (opcional)
 * @returns Resultado del análisis
 */
export async function analyzeRepositoryElements(
  analysisRequest: AnalysisRequest,
  githubToken?: string,
  apiKey?: string
): Promise<AnalysisResult> {
  try {
    const { repositoryStructure, selectedItems, customPrompt, includeContent } = analysisRequest;
    
    // Filtrar elementos seleccionados
    const selectedFiles = selectedItems.filter(item => item.selected && item.type === 'file');
    const selectedDirectories = selectedItems.filter(item => item.selected && item.type === 'directory');
    
    if (selectedFiles.length === 0 && selectedDirectories.length === 0) {
      throw new Error('No se han seleccionado elementos para analizar');
    }

    // Obtener contenido de archivos si se solicita
    let filesContent = '';
    if (includeContent && selectedFiles.length > 0) {
      const contents = await getSelectedFilesContent(
        repositoryStructure.fullName,
        selectedFiles,
        githubToken
      );
      
      filesContent = Object.entries(contents)
        .map(([path, content]) => {
          const language = getLanguageFromExtension(path);
          return `\n--- ARCHIVO: ${path} (${language}) ---\n${content}\n`;
        })
        .join('\n');
    }

    // Preparar información de estructura
    const structureInfo = `
INFORMACIÓN DEL REPOSITORIO:
- Nombre: ${repositoryStructure.name}
- URL: ${repositoryStructure.url}
- Descripción: ${repositoryStructure.description || 'Sin descripción'}
- Total de archivos: ${repositoryStructure.totalFiles}
- Total de directorios: ${repositoryStructure.totalDirectories}
- Lenguajes detectados: ${Object.keys(repositoryStructure.languages).join(', ')}

ELEMENTOS SELECCIONADOS:
- Archivos: ${selectedFiles.length}
- Directorios: ${selectedDirectories.length}

ARCHIVOS SELECCIONADOS:
${selectedFiles.map(f => `- ${f.path}`).join('\n')}

DIRECTORIOS SELECCIONADOS:
${selectedDirectories.map(d => `- ${d.path}/`).join('\n')}`;

    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const prompt = `
Eres un experto analista de código y repositorios de software. Analiza los elementos seleccionados del siguiente repositorio según el prompt personalizado proporcionado.

${structureInfo}

PROMPT PERSONALIZADO:
${customPrompt}

${includeContent && filesContent ? `CONTENIDO DE LOS ARCHIVOS SELECCIONADOS:${filesContent}` : 'NOTA: Solo se está analizando la estructura, no el contenido de los archivos.'}

IMPORTANTE: Cuando hagas referencia a archivos específicos en tu análisis, SIEMPRE incluye un enlace directo al archivo usando el formato:
[nombre_del_archivo](${repositoryStructure.url}/blob/${repositoryStructure.defaultBranch}/ruta_del_archivo)

Ejemplo: Si mencionas el archivo "src/main.js", escríbelo como: [src/main.js](${repositoryStructure.url}/blob/${repositoryStructure.defaultBranch}/src/main.js)

Por favor, proporciona un análisis detallado que incluya:
1. Análisis específico según el prompt personalizado
2. Resumen ejecutivo del análisis
3. Recomendaciones específicas (3-5 puntos)
4. Una puntuación opcional del 0-10 si es aplicable según el contexto del prompt

Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "analysis": string, // Análisis detallado según el prompt personalizado (incluye enlaces a archivos cuando los menciones)
  "summary": string, // Resumen ejecutivo (2-3 líneas)
  "recommendations": string[], // Array de 3-5 recomendaciones específicas (incluye enlaces a archivos cuando sea relevante)
  "score": number | null // Puntuación 0-10 si es aplicable, null si no
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
          repositoryUrl: repositoryStructure.url,
          prompt: customPrompt,
          selectedItems,
          analysis: result.analysis || 'No se pudo generar análisis',
          summary: result.summary || 'No se pudo generar resumen',
          recommendations: result.recommendations || [],
          score: result.score,
          analyzedAt: new Date().toISOString(),
          itemsAnalyzed: selectedFiles.length + selectedDirectories.length
        };
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
        throw new Error('Error al procesar la respuesta de Gemini AI');
      }
    }

    throw new Error('No se pudo extraer el análisis de la respuesta de Gemini AI');
  } catch (error) {
    console.error('Error al analizar elementos del repositorio:', error);
    throw new Error(`Error al analizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Determina el lenguaje de programación basado en la extensión del archivo
 */
function getLanguageFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript (React)',
    'ts': 'TypeScript',
    'tsx': 'TypeScript (React)',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    'md': 'Markdown',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash',
    'ps1': 'PowerShell',
    'dockerfile': 'Docker',
    'vue': 'Vue.js',
    'svelte': 'Svelte',
    'dart': 'Dart',
    'kt': 'Kotlin',
    'swift': 'Swift',
    'r': 'R',
    'scala': 'Scala',
    'clj': 'Clojure',
    'elm': 'Elm'
  };
  return languageMap[extension || ''] || 'Texto';
}

/**
 * Decodificador base64 seguro para UTF-8
 */
function decodeBase64Utf8(base64: string): string {
  try {
    const binary = atob(base64.replace(/\n/g, ''));
    const bytes = new Uint8Array([...binary].map(char => char.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    console.error('Error al decodificar base64:', error);
    return 'Error al decodificar contenido';
  }
}

/**
 * Convierte la estructura de directorios en una lista plana para la interfaz
 * @param structure Estructura del repositorio
 * @returns Lista plana de elementos
 */
export function flattenRepositoryStructure(structure: RepositoryStructure): SelectedItem[] {
  const items: SelectedItem[] = [];
  
  // Agregar archivos de primer nivel
  structure.files.forEach(file => {
    items.push({
      path: file.path,
      type: 'file',
      name: file.name,
      selected: false
    });
  });
  
  // Función recursiva para procesar directorios
  function processDirectory(directory: RepositoryDirectory, parentPath: string = '') {
    const fullPath = parentPath ? `${parentPath}/${directory.name}` : directory.name;
    
    items.push({
      path: directory.path,
      type: 'directory',
      name: directory.name,
      selected: false
    });
    
    directory.children.forEach(child => {
      if (child.type === 'file') {
        items.push({
          path: child.path,
          type: 'file',
          name: child.name,
          selected: false
        });
      } else {
        processDirectory(child as RepositoryDirectory, fullPath);
      }
    });
  }
  
  // Procesar directorios de primer nivel
  structure.directories.forEach(directory => {
    processDirectory(directory);
  });
  
  return items.sort((a, b) => {
    // Ordenar directorios primero, luego archivos
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });
}

/**
 * Corrige la redacción de un prompt usando Gemini AI
 * @param prompt Prompt original a corregir
 * @returns Prompt corregido
 */
export async function correctPromptWriting(prompt: string, apiKey?: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error('El prompt no puede estar vacío');
    }

    if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const correctionPrompt = `
Eres un experto en redacción y comunicación técnica. Tu tarea es corregir y mejorar la redacción del siguiente prompt para análisis de repositorios de código.

PROMPT ORIGINAL:
"${prompt}"

INSTRUCCIONES:
1. Corrige errores ortográficos y gramaticales
2. Mejora la claridad y precisión del lenguaje
3. Mantén el significado e intención original
4. Usa un tono profesional y técnico apropiado
5. Asegúrate de que sea específico y actionable para análisis de código
6. Conserva el idioma original del prompt

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

/**
 * Obtiene estadísticas del repositorio
 * @param structure Estructura del repositorio
 * @returns Estadísticas del repositorio
 */
export function getRepositoryStats(structure: RepositoryStructure) {
  const stats = {
    totalFiles: structure.totalFiles,
    totalDirectories: structure.totalDirectories,
    languages: structure.languages,
    topLanguages: Object.entries(structure.languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count })),
    averageFilesPerDirectory: structure.totalDirectories > 0 
      ? Math.round(structure.totalFiles / structure.totalDirectories * 100) / 100 
      : structure.totalFiles
  };
  
  return stats;
}