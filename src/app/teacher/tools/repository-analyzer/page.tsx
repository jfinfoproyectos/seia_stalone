'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  GitBranch, 
  Folder, 
  File, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Square,
  BarChart3,
  FileText,
  Code,
  Loader2,
  ExternalLink,
  Settings,
  Wand2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkdownViewer } from '@/app/teacher/evaluations/components/markdown-viewer';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Link, Image as PDFImage } from '@react-pdf/renderer';
import { useTheme } from 'next-themes';
// Removed jsPDF autoTable import
import {
  RepositoryStructure,
  RepositoryDirectory,
  RepositoryFile,
  SelectedItem,
  AnalysisResult,
  AnalysisRequest,
  getRepositoryStructure,
  analyzeRepositoryElements,
  flattenRepositoryStructure,
  getRepositoryStats,
  correctPromptWriting
} from '@/lib/gemini-repository-analyzer';

// Estilos globales del PDF (profesional)
const getPdfStyles = (isDark: boolean) => {
  const palette = {
    pageBg: isDark ? '#111111' : '#ffffff',
    text: isDark ? '#eeeeee' : '#222222',
    muted: isDark ? '#bbbbbb' : '#555555',
    border: isDark ? '#444444' : '#cccccc',
    hr: isDark ? '#333333' : '#dddddd',
  };

  return StyleSheet.create({
    page: { padding: 40, fontSize: 11, backgroundColor: palette.pageBg },
    header: { marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: palette.text },
    subtitle: { fontSize: 12, marginTop: 6, color: palette.text },
    meta: { fontSize: 10, color: palette.muted },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 6, color: palette.text },
    text: { fontSize: 10, lineHeight: 1.5, color: palette.text },
    footerText: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 9, color: palette.muted, textAlign: 'center' },
    // Markdown styles
    h1: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: palette.text },
    h2: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: palette.text },
    h3: { fontSize: 12, fontWeight: 'bold', marginBottom: 6, color: palette.text },
    p: { fontSize: 10, lineHeight: 1.5, marginBottom: 6, color: palette.text },
    listContainer: { marginLeft: 12, marginBottom: 6 },
    li: { fontSize: 10, lineHeight: 1.5, color: palette.text },
    blockquote: { borderLeftWidth: 2, borderLeftColor: palette.border, paddingLeft: 8, color: palette.text, marginBottom: 6 },
    codeBlock: { fontFamily: 'Courier', fontSize: 9, borderWidth: 1, borderColor: palette.border, padding: 8, borderRadius: 4, marginBottom: 8, color: palette.text },
    inlineCode: { fontFamily: 'Courier', fontSize: 9, borderWidth: 1, borderColor: palette.border, padding: 2, borderRadius: 3, color: palette.text },
    bold: { fontWeight: 'bold', color: palette.text },
    italic: { fontStyle: 'italic', color: palette.text },
    hr: { borderBottomWidth: 1, borderBottomColor: palette.hr, marginVertical: 8 },
    image: { width: 300, height: 200, objectFit: 'contain', marginBottom: 8 }
  });
};

// Renderer de Markdown robusto para React PDF
const MarkdownRenderer: React.FC<{ markdown: string; styles: ReturnType<typeof getPdfStyles> }> = ({ markdown, styles }) => {
  const elements: React.ReactElement[] = [];
  const lines = (markdown || '').split(/\r?\n/);
  let inCode = false;
  let codeLines: string[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (listBuffer) {
      elements.push(
        <View style={styles.listContainer} key={`list-${elements.length}`}>
          {listBuffer.items.map((it, idx) => (
            <Text style={styles.li} key={`li-${idx}`}>{listBuffer!.ordered ? `${idx + 1}. ` : '• '}{renderInline(it)}</Text>
          ))}
        </View>
      );
      listBuffer = null;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Images ![alt](src)
    const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const src = imgMatch[2];
      elements.push(<PDFImage key={`img-${elements.length}`} style={styles.image} src={src} />);
      return null;
    }

    // Links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(text))) {
      const [full, label, url] = m;
      if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
      parts.push(<Link key={`lnk-${m.index}-${url}`} src={url}>{label}</Link>);
      lastIndex = m.index + full.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    // Inline styles: bold, italic, code
    const styleTokens = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)/g;
    const processed: React.ReactNode[] = [];
    for (const part of parts) {
      if (typeof part !== 'string') { processed.push(part); continue; }
      let cursor = 0; let match: RegExpExecArray | null;
      while ((match = styleTokens.exec(part))) {
        if (match.index > cursor) processed.push(part.slice(cursor, match.index));
        const token = match[0];
        if (token.startsWith('**')) processed.push(<Text style={styles.bold} key={`b-${match.index}`}>{token.slice(2, -2)}</Text>);
        else if (token.startsWith('*')) processed.push(<Text style={styles.italic} key={`i-${match.index}`}>{token.slice(1, -1)}</Text>);
        else if (token.startsWith('`')) processed.push(<Text style={styles.inlineCode} key={`c-${match.index}`}>{token.slice(1, -1)}</Text>);
        cursor = match.index + token.length;
      }
      if (cursor < part.length) processed.push(part.slice(cursor));
    }
    return processed;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    // Code fence
    if (/^```/.test(line)) {
      if (!inCode) { inCode = true; codeLines = []; flushList(); }
      else { inCode = false; elements.push(<Text style={styles.codeBlock} key={`code-${elements.length}`}>{codeLines.join('\n')}</Text>); codeLines = []; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Horizontal rule
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) { flushList(); elements.push(<View style={styles.hr} key={`hr-${elements.length}`} />); continue; }

    // Blank line => paragraph break
    if (!line.trim()) { flushList(); elements.push(<Text key={`sp-${elements.length}`}> </Text>); continue; }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushList(); const level = h[1].length; const content = h[2]; const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3; elements.push(<Text style={style} key={`h-${elements.length}`}>{content}</Text>); continue; }

    // Blockquote
    const bq = line.match(/^>\s+(.*)$/);
    if (bq) { flushList(); elements.push(<Text style={styles.blockquote} key={`bq-${elements.length}`}>{renderInline(bq[1])}</Text>); continue; }

    // Lists
    const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      const ordered = /\d+\./.test(li[1]);
      if (!listBuffer) listBuffer = { ordered, items: [] };
      listBuffer.items.push(li[2]);
      continue;
    }

    // Paragraph
    flushList();
    elements.push(<Text style={styles.p} key={`p-${elements.length}`}>{renderInline(line)}</Text>);
  }
  flushList();

  return <View>{elements}</View>;
};

// Documento profesional de análisis con @react-pdf/renderer
const ReportDocument: React.FC<{ analysisResult: AnalysisResult; repositoryStructure: RepositoryStructure; scoreScale: 'NONE' | 'FIVE' | 'TEN'; isDark: boolean; }> = ({ analysisResult, repositoryStructure, scoreScale, isDark }) => {
  const dateStr = new Date(analysisResult.analyzedAt || Date.now()).toLocaleDateString('es-ES');
  const styles = getPdfStyles(isDark);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Análisis de Repositorio</Text>
          <Text style={styles.subtitle}>{repositoryStructure.name}</Text>
          <Text style={styles.meta}>URL: {repositoryStructure.url}</Text>
          <Text style={styles.meta}>Fecha: {dateStr}</Text>
        </View>

        {analysisResult.studentInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del Estudiante</Text>
            <Text style={styles.text}>Nombre: {analysisResult.studentInfo.nombres} {analysisResult.studentInfo.apellidos}</Text>
            <Text style={styles.text}>Grupo: {analysisResult.studentInfo.grupo}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.text}>Elementos Analizados: {analysisResult.itemsAnalyzed}</Text>
          {scoreScale !== 'NONE' && (
            <Text style={styles.text}>Puntuación: {analysisResult.score}/{scoreScale === 'FIVE' ? 5 : 10}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
          <MarkdownRenderer markdown={analysisResult.summary || ''} styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis Detallado</Text>
          <MarkdownRenderer markdown={analysisResult.analysis || ''} styles={styles} />
        </View>

        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
};

interface TreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  selected: boolean;
  expanded?: boolean;
  language?: string;
  size?: number;
}

export default function RepositoryAnalyzerPage() {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Estados principales
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para forks del repositorio original
  const [originalRepoUrl, setOriginalRepoUrl] = useState('');
  const [forks, setForks] = useState<{ id: number; full_name: string; html_url: string; owner: { login: string }; info?: { nombres: string; apellidos: string; grupo: string } }[]>([]);
  const [loadingForks, setLoadingForks] = useState(false);
  const [forksError, setForksError] = useState('');
  const [forkSearch, setForkSearch] = useState('');
  
  // Estados del repositorio
  const [repositoryStructure, setRepositoryStructure] = useState<RepositoryStructure | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Estados del análisis
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPredefinedPrompt, setSelectedPredefinedPrompt] = useState('');
  const [correctingPrompt, setCorrectingPrompt] = useState(false);

  // Prompts predefinidos para análisis de repositorios
  const predefinedPrompts = [
    {
      id: 'code-quality',
      title: 'Análisis de Calidad de Código',
      description: 'Evalúa la calidad general del código, patrones y buenas prácticas',
      prompt: 'Analiza la calidad del código en los elementos seleccionados. Evalúa: 1) Legibilidad y claridad del código, 2) Uso de patrones de diseño, 3) Cumplimiento de buenas prácticas de programación, 4) Estructura y organización del código, 5) Comentarios y documentación, 6) Manejo de errores y excepciones. Proporciona recomendaciones específicas para mejorar la calidad del código.'
    },
    {
      id: 'architecture',
      title: 'Análisis de Arquitectura',
      description: 'Examina la arquitectura del proyecto y su estructura organizacional',
      prompt: 'Analiza la arquitectura y estructura del proyecto en los elementos seleccionados. Evalúa: 1) Organización de directorios y archivos, 2) Separación de responsabilidades, 3) Patrones arquitectónicos utilizados, 4) Acoplamiento y cohesión entre módulos, 5) Escalabilidad de la estructura, 6) Convenciones de nomenclatura. Identifica fortalezas y áreas de mejora en la arquitectura.'
    },
    {
      id: 'security',
      title: 'Análisis de Seguridad',
      description: 'Identifica vulnerabilidades y problemas de seguridad potenciales',
      prompt: 'Realiza un análisis de seguridad de los elementos seleccionados. Busca: 1) Vulnerabilidades comunes (OWASP Top 10), 2) Manejo inseguro de datos sensibles, 3) Validación de entrada inadecuada, 4) Problemas de autenticación y autorización, 5) Exposición de información sensible, 6) Configuraciones inseguras. Proporciona recomendaciones para mejorar la seguridad.'
    },
    {
      id: 'performance',
      title: 'Análisis de Rendimiento',
      description: 'Evalúa el rendimiento y optimización del código',
      prompt: 'Analiza el rendimiento y eficiencia de los elementos seleccionados. Evalúa: 1) Complejidad algorítmica, 2) Uso eficiente de recursos, 3) Posibles cuellos de botella, 4) Optimizaciones de consultas/operaciones, 5) Manejo de memoria, 6) Operaciones costosas innecesarias. Sugiere optimizaciones específicas para mejorar el rendimiento.'
    },
    {
      id: 'maintainability',
      title: 'Análisis de Mantenibilidad',
      description: 'Evalúa qué tan fácil es mantener y modificar el código',
      prompt: 'Analiza la mantenibilidad del código en los elementos seleccionados. Evalúa: 1) Facilidad para realizar cambios, 2) Modularidad y reutilización, 3) Dependencias y acoplamiento, 4) Documentación del código, 5) Pruebas unitarias y cobertura, 6) Consistencia en el estilo de código. Proporciona recomendaciones para mejorar la mantenibilidad.'
    },
    {
      id: 'documentation',
      title: 'Análisis de Documentación',
      description: 'Evalúa la calidad y completitud de la documentación',
      prompt: 'Analiza la documentación presente en los elementos seleccionados. Evalúa: 1) Completitud de comentarios en el código, 2) Documentación de APIs y funciones, 3) README y documentación del proyecto, 4) Ejemplos de uso, 5) Documentación de configuración, 6) Guías de contribución. Identifica gaps en la documentación y sugiere mejoras.'
    },
    {
      id: 'testing',
      title: 'Análisis de Testing',
      description: 'Evalúa la estrategia y cobertura de pruebas',
      prompt: 'Analiza la estrategia de testing en los elementos seleccionados. Evalúa: 1) Presencia y calidad de pruebas unitarias, 2) Pruebas de integración, 3) Cobertura de código, 4) Casos de prueba edge cases, 5) Mocking y stubbing, 6) Estructura de los tests. Proporciona recomendaciones para mejorar la estrategia de testing.'
    },
    {
      id: 'dependencies',
      title: 'Análisis de Dependencias',
      description: 'Examina las dependencias del proyecto y su gestión',
      prompt: 'Analiza las dependencias y su gestión en los elementos seleccionados. Evalúa: 1) Dependencias utilizadas y su necesidad, 2) Versiones y actualizaciones, 3) Vulnerabilidades conocidas, 4) Tamaño del bundle, 5) Dependencias circulares, 6) Gestión de dependencias dev vs producción. Sugiere optimizaciones en el manejo de dependencias.'
    }
  ];

  // Función para manejar la selección de prompts predefinidos
  const handlePredefinedPromptSelect = (promptId: string) => {
    const selectedPrompt = predefinedPrompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      setCustomPrompt(selectedPrompt.prompt);
      setSelectedPredefinedPrompt(promptId);
    }
  };

  // Función para limpiar la selección de prompt predefinido
  const clearPredefinedPrompt = () => {
    setSelectedPredefinedPrompt('');
    setCustomPrompt('');
  };

  // Función para corregir la redacción del prompt
  const handleCorrectPrompt = async () => {
    if (!customPrompt.trim()) {
      setError('No hay prompt para corregir');
      return;
    }

    setCorrectingPrompt(true);
    setError('');

    try {
      const correctedPrompt = await correctPromptWriting(customPrompt);
      setCustomPrompt(correctedPrompt);
      
      toast({
        title: "Prompt corregido",
        description: "La redacción del prompt ha sido mejorada exitosamente",
      });
    } catch (error) {
      console.error('Error al corregir prompt:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al corregir el prompt');
    } finally {
      setCorrectingPrompt(false);
    }
  };
  const [includeContent, setIncludeContent] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [scoreScale, setScoreScale] = useState<'NONE' | 'TEN' | 'FIVE'>('FIVE');
  
  // Estados de la interfaz
  const [activeTab, setActiveTab] = useState('scan');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Cargar token desde localStorage al montar el componente
  useEffect(() => {
    const savedToken = localStorage.getItem('github-token');
    if (savedToken) {
      setGithubToken(savedToken);
    }
  }, []);

  // Función para actualizar el token y guardarlo en localStorage
  const updateGithubToken = (token: string) => {
    setGithubToken(token);
    if (token.trim()) {
      localStorage.setItem('github-token', token);
    } else {
      localStorage.removeItem('github-token');
    }
  };

  // Función para escanear el repositorio (acepta repo opcional para evitar estados stale)
  const handleScanRepository = async (repoArg?: string) => {
    const input = (repoArg ?? repoUrl).trim();
    if (!input) {
      setError('Por favor, ingresa la URL del repositorio');
      return;
    }

    // Permitir pegar la URL completa o owner/repo
    let repoPath = input;
    
    // Si es una URL, extraer owner/repo
    const match = repoPath.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/i);
    if (match) {
      repoPath = `${match[1]}/${match[2]}`;
    }
    
    // Limpiar caracteres especiales al final
    repoPath = repoPath.replace(/\/$/, ''); // Remover slash final
    repoPath = repoPath.replace(/\.git$/, ''); // Remover .git al final si quedó
    
    if (!repoPath.includes('/')) {
      setError('Formato inválido. Usa owner/repo o la URL completa del repositorio.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const structure = await getRepositoryStructure(repoPath, githubToken || undefined);
      setRepositoryStructure(structure);
      
      // Convertir estructura a árbol de nodos
      const flatItems = flattenRepositoryStructure(structure);
      setSelectedItems(flatItems);
      
      // Crear árbol jerárquico para la visualización
      const tree = buildTreeFromStructure(structure);
      setTreeNodes(tree);
      
      // Cambiar a la pestaña de selección
      setActiveTab('select');
      
      toast({
        title: "Repositorio escaneado exitosamente",
        description: `Se encontraron ${structure.totalFiles} archivos y ${structure.totalDirectories} directorios`,
      });
    } catch (error) {
      console.error('Error al escanear repositorio:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al escanear el repositorio');
    } finally {
      setLoading(false);
    }
  };

  // Función para construir el árbol jerárquico
  const buildTreeFromStructure = (structure: RepositoryStructure): TreeNode[] => {
    const nodes: TreeNode[] = [];
    
    // Agregar archivos de primer nivel
    structure.files.forEach(file => {
      nodes.push({
        path: file.path,
        name: file.name,
        type: 'file',
        selected: false,
        language: file.language,
        size: file.size
      });
    });
    
    // Agregar directorios de primer nivel
    structure.directories.forEach(directory => {
      const node = buildDirectoryNode(directory);
      nodes.push(node);
    });
    
    return nodes.sort((a, b) => {
      // Directorios primero, luego archivos
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Función recursiva para construir nodos de directorio
  const buildDirectoryNode = (directory: RepositoryDirectory): TreeNode => {
    const children: TreeNode[] = [];
    
    directory.children.forEach((child: RepositoryFile | RepositoryDirectory) => {
      if (child.type === 'file') {
        children.push({
          path: child.path,
          name: child.name,
          type: 'file',
          selected: false,
          language: child.language,
          size: child.size
        });
      } else if (child.type === 'directory') {
        children.push(buildDirectoryNode(child as RepositoryDirectory));
      }
    });
    
    return {
      path: directory.path,
      name: directory.name,
      type: 'directory',
      selected: false,
      expanded: false,
      children: children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
    };
  };

  // Función para alternar la expansión de un nodo
  const toggleNodeExpansion = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Función para alternar la selección de un elemento
  const toggleItemSelection = (path: string) => {
    // Encontrar el elemento en selectedItems
    const targetItem = selectedItems.find(item => item.path === path);
    if (!targetItem) return;
    
    const newSelectionState = !targetItem.selected;
    
    // Si es un directorio, seleccionar/deseleccionar todos los elementos contenidos
    if (targetItem.type === 'directory') {
      setSelectedItems(prev => 
        prev.map(item => {
          // Seleccionar el directorio mismo
          if (item.path === path) {
            return { ...item, selected: newSelectionState };
          }
          // Seleccionar todos los elementos que están dentro de este directorio
          if (item.path.startsWith(path + '/')) {
            return { ...item, selected: newSelectionState };
          }
          return item;
        })
      );
    } else {
      // Si es un archivo, solo cambiar su estado
      setSelectedItems(prev => 
        prev.map(item => 
          item.path === path 
            ? { ...item, selected: newSelectionState }
            : item
        )
      );
    }
    
    // Actualizar también el árbol de nodos
    setTreeNodes(prev => updateNodeSelection(prev, path, newSelectionState));
  };

  // Función recursiva para actualizar la selección en el árbol
  const updateNodeSelection = (nodes: TreeNode[], targetPath: string, newSelectionState?: boolean): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        const selectionState = newSelectionState !== undefined ? newSelectionState : !node.selected;
        
        // Si es un directorio, actualizar también todos sus hijos
        if (node.type === 'directory' && node.children) {
          return {
            ...node,
            selected: selectionState,
            children: updateAllChildrenSelection(node.children, selectionState)
          };
        }
        
        return { ...node, selected: selectionState };
      }
      
      // Si es un directorio padre del targetPath, actualizar recursivamente
      if (node.children && targetPath.startsWith(node.path + '/')) {
        return {
          ...node,
          children: updateNodeSelection(node.children, targetPath, newSelectionState)
        };
      }
      
      return node;
    });
  };
  
  // Función auxiliar para actualizar la selección de todos los hijos
  const updateAllChildrenSelection = (nodes: TreeNode[], selected: boolean): TreeNode[] => {
    return nodes.map(node => ({
      ...node,
      selected,
      children: node.children ? updateAllChildrenSelection(node.children, selected) : undefined
    }));
  };

  // Función para seleccionar/deseleccionar todos los elementos
  const toggleSelectAll = () => {
    const allSelected = selectedItems.every(item => item.selected);
    setSelectedItems(prev => 
      prev.map(item => ({ ...item, selected: !allSelected }))
    );
    
    // Actualizar también el árbol
    setTreeNodes(prev => updateAllNodesSelection(prev, !allSelected));
  };

  // Función recursiva para actualizar toda la selección
  const updateAllNodesSelection = (nodes: TreeNode[], selected: boolean): TreeNode[] => {
    return nodes.map(node => ({
      ...node,
      selected,
      children: node.children ? updateAllNodesSelection(node.children, selected) : undefined
    }));
  };

  // Función para realizar el análisis
  const handleAnalyze = async () => {
    if (!repositoryStructure) {
      setError('Primero debes escanear un repositorio');
      return;
    }

    if (!customPrompt.trim()) {
      setError('Por favor, ingresa un prompt personalizado para el análisis');
      return;
    }

    const selectedCount = selectedItems.filter(item => item.selected).length;
    if (selectedCount === 0) {
      setError('Por favor, selecciona al menos un elemento para analizar');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const analysisRequest: AnalysisRequest = {
        repositoryStructure,
        selectedItems,
        customPrompt,
        includeContent,
        scoreScale
      };

      const result = await analyzeRepositoryElements(analysisRequest, githubToken || undefined);
      setAnalysisResult(result);
      setActiveTab('results');
      
      toast({
        title: "Análisis completado",
        description: `Se analizaron ${result.itemsAnalyzed} elementos exitosamente`,
      });
    } catch (error) {
      console.error('Error al analizar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al realizar el análisis');
    } finally {
      setAnalyzing(false);
    }
  };

// Exportación PDF ahora se realiza con PDFDownloadLink y ReportDocument de @react-pdf/renderer

  // Helpers de autenticación para GitHub
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
    if (githubToken) headers['Authorization'] = `token ${githubToken}`;
    return headers;
  };

  // Helpers para cargar info.json de cada fork
  type ForkInfo = { nombres: string; apellidos: string; grupo: string };

  const fetchForkInfoJson = async (fullName: string): Promise<ForkInfo | null> => {
    try {
      const res = await fetch(`https://api.github.com/repos/${fullName}/contents/info.json`, { headers: getAuthHeaders() });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const contentData = await res.json();
      if (contentData?.download_url) {
        const rawRes = await fetch(contentData.download_url);
        if (!rawRes.ok) return null;
        const text = await rawRes.text();
        const parsed = JSON.parse(text);
        return { nombres: parsed.nombres || '', apellidos: parsed.apellidos || '', grupo: parsed.grupo || '' };
      } else if (contentData?.content && contentData?.encoding === 'base64') {
        const decoded = typeof atob === 'function' ? atob(contentData.content) : Buffer.from(contentData.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        return { nombres: parsed.nombres || '', apellidos: parsed.apellidos || '', grupo: parsed.grupo || '' };
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadInfoForForks = async (forksList: { full_name: string }[]) => {
    const entries = await Promise.all(
      forksList.map(async (f) => ({ full_name: f.full_name, info: await fetchForkInfoJson(f.full_name) }))
    );
    const infoMap = new Map<string, ForkInfo>(entries.filter(e => e.info).map(e => [e.full_name, e.info as ForkInfo]));
    setForks(prev => prev.map(f => infoMap.has(f.full_name) ? { ...f, info: infoMap.get(f.full_name)! } : f));
  };

  // Helpers para cargar info.json de cada fork
  

  // Buscar forks del repositorio original
  const handleFetchForks = async () => {
    if (!originalRepoUrl.trim()) {
      setForksError('Por favor, ingresa la URL o owner/repo del repositorio original');
      return;
    }

    // Permitir pegar la URL completa o owner/repo
    let repoPath = originalRepoUrl.trim();
    const match = repoPath.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/i);
    if (match) {
      repoPath = `${match[1]}/${match[2]}`;
    }
    repoPath = repoPath.replace(/\/$/, '').replace(/\.git$/, '');
    if (!repoPath.includes('/')) {
      setForksError('Formato inválido. Usa owner/repo o la URL completa del repositorio.');
      return;
    }

    setLoadingForks(true);
    setForksError('');

    try {
      const res = await fetch(`https://api.github.com/repos/${repoPath}/forks`, { headers: getAuthHeaders() });
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        const msg = (errorData && errorData.message) || '';
        if (msg.includes('rate limit')) {
          const suggestion = githubToken
            ? 'Límite de API excedido incluso con token. Espera unos minutos.'
            : 'Límite de API excedido. Configura un Personal Access Token para aumentar el límite a 5,000/hora.';
          throw new Error(`⚠️ ${suggestion}`);
        } else if (msg.includes('Forbidden')) {
          throw new Error('❌ Acceso denegado. El repositorio puede ser privado o no existe.');
        }
      } else if (res.status === 404) {
        throw new Error(`❌ Repository '${repoPath}' not found. Verifica el nombre y que sea público.`);
      } else if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`❌ Error ${res.status}: ${errorData.message || 'No se pudo obtener los forks'}`);
      }

      const data: { id: number; full_name: string; html_url: string; owner: { login: string } }[] = await res.json();
      setForks(data);
      setOriginalRepoUrl(repoPath);
      toast({ title: 'Forks cargados', description: `Se encontraron ${data.length} forks` });

      // Cargar info.json por cada fork
      await loadInfoForForks(data);
    } catch (err: unknown) {
      setForks([]);
      if (err instanceof Error) setForksError(err.message); else setForksError('Error desconocido al obtener forks');
    } finally {
      setLoadingForks(false);
    }
  };

  // Seleccionar un fork y escanear su estructura
  const selectForkAndScan = async (forkFullName: string) => {
    setRepoUrl(forkFullName); // actualizar el input visible
    await handleScanRepository(forkFullName); // usar el valor directamente para evitar doble clic
  };

  // Función para filtrar nodos según el texto de búsqueda
  const filterNodes = (nodes: TreeNode[], filter: string): TreeNode[] => {
    if (!filter && !showOnlySelected) return nodes;
    
    return nodes.filter(node => {
      const matchesFilter = !filter || node.name.toLowerCase().includes(filter.toLowerCase());
      const matchesSelection = !showOnlySelected || node.selected;
      
      if (node.type === 'file') {
        return matchesFilter && matchesSelection;
      }
      
      // Para directorios, incluir si coincide o tiene hijos que coinciden
      if (matchesFilter && matchesSelection) return true;
      
      if (node.children) {
        const filteredChildren = filterNodes(node.children, filter);
        return filteredChildren.length > 0;
      }
      
      return false;
    }).map(node => {
      if (node.children) {
        return {
          ...node,
          children: filterNodes(node.children, filter)
        };
      }
      return node;
    });
  };



  // Función para renderizar un nodo del árbol
  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.path} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-muted dark:hover:bg-input/50 rounded cursor-pointer ${
            node.selected ? 'bg-accent/20' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* Icono de expansión para directorios */}
          {node.type === 'directory' && (
            <button
              onClick={() => toggleNodeExpansion(node.path)}
              className="mr-1 p-1 hover:bg-muted rounded"
            >
              {hasChildren && isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : hasChildren ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3" />
              )}
            </button>
          )}
          
          {/* Checkbox de selección */}
          <Checkbox
            checked={node.selected}
            onCheckedChange={() => toggleItemSelection(node.path)}
            className="mr-2"
            title={node.type === 'directory' ? 'Seleccionar carpeta y todo su contenido' : 'Seleccionar archivo'}
          />
          
          {/* Icono del tipo */}
          {node.type === 'directory' ? (
            <Folder className="h-4 w-4 mr-2 text-primary" />
          ) : (
            <File className="h-4 w-4 mr-2 text-muted-foreground" />
          )}
          
          {/* Nombre del elemento */}
          <span className="flex-1 text-sm">{node.name}</span>
          
          {/* Información adicional */}
          {node.type === 'file' && node.language && (
            <Badge variant="outline" className="ml-2 text-xs">
              {node.language}
            </Badge>
          )}
          
          {node.type === 'file' && node.size && (
            <span className="ml-2 text-xs text-muted-foreground">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        
        {/* Renderizar hijos si está expandido */}
        {node.type === 'directory' && hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Función para formatear el tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Obtener estadísticas del repositorio
  const stats = repositoryStructure ? getRepositoryStats(repositoryStructure) : null;
  const selectedCount = selectedItems.filter(item => item.selected).length;
  const filteredNodes = treeNodes ? filterNodes(treeNodes, filterText) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analizador de Repositorios GitHub</h1>
          <p className="text-gray-600 mt-2">
            Escanea repositorios completos, selecciona elementos específicos y realiza análisis personalizados con IA
          </p>
        </div>
        
        {/* Configuración de token */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenInput(!showTokenInput)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Token GitHub
          </Button>
        </div>
      </div>

      {/* Input de token GitHub */}
      {showTokenInput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de Token GitHub</CardTitle>
            <CardDescription>
              Proporciona un token de GitHub para acceder a repositorios privados y evitar límites de rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => updateGithubToken(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setShowTokenInput(false)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">1. Escanear</TabsTrigger>
          <TabsTrigger value="select" disabled={!repositoryStructure}>2. Seleccionar</TabsTrigger>
          <TabsTrigger value="analyze" disabled={!repositoryStructure}>3. Analizar</TabsTrigger>
          <TabsTrigger value="results" disabled={!analysisResult}>4. Resultados</TabsTrigger>
        </TabsList>

        {/* Pestaña de escaneo */}
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Escanear Repositorio
              </CardTitle>
              <CardDescription>
                Ingresa la URL de un repositorio de GitHub para escanear su estructura completa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Escaneo directo de un repositorio */}
              <div>
                <Label htmlFor="repo-url" className='mb-2'>URL del Repositorio</Label>
                <Input
                  id="repo-url"
                  placeholder="URL completa o owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}
              
              <Button 
                onClick={() => handleScanRepository()} 
                disabled={loading || !repoUrl.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Escanear Repositorio
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="border-t" />
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">o</div>
              </div>

              {/* Escaneo de forks del repositorio original */}
              <div className="space-y-2">
                <Label htmlFor="original-repo-url" className='mb-2'>Repositorio Original (para listar forks)</Label>
                <Input
                  id="original-repo-url"
                  placeholder="URL completa o owner/repo del repo original"
                  value={originalRepoUrl}
                  onChange={(e) => setOriginalRepoUrl(e.target.value)}
                  disabled={loadingForks}
                />
                {forksError && (
                  <div className="text-destructive-foreground text-sm bg-destructive/15 p-3 rounded">
                    {forksError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleFetchForks}
                    disabled={loadingForks || !originalRepoUrl.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    {loadingForks ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando forks...
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-4 w-4 mr-2" />
                        Listar Forks
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Lista de forks con filtro */}
              {forks.length > 0 && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar forks por nombre..."
                      value={forkSearch}
                      onChange={(e) => setForkSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="border rounded-lg max-h-72 overflow-y-auto">
                    {forks
                      .filter(f => !forkSearch.trim() || f.full_name.toLowerCase().includes(forkSearch.toLowerCase()))
                      .map((fork) => (
                        <div key={fork.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{fork.full_name}</span>
                              {fork.info && (
                                <span className="text-xs text-muted-foreground">
                                  {fork.info.nombres} {fork.info.apellidos} — Grupo: {fork.info.grupo}
                                </span>
                              )}
                              <a href={fork.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center">
                                <ExternalLink className="h-3 w-3 mr-1" /> Ver en GitHub
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button size="sm" onClick={() => selectForkAndScan(fork.full_name)}>
                               Escanear este fork
                             </Button>
                           </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de selección */}
        <TabsContent value="select" className="space-y-4">
          {repositoryStructure && (
            <>
              {/* Estadísticas del repositorio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Información del Repositorio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats?.totalFiles}</div>
                      <div className="text-sm text-gray-600">Archivos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats?.totalDirectories}</div>
                      <div className="text-sm text-gray-600">Directorios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedCount}</div>
                      <div className="text-sm text-gray-600">Seleccionados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{Object.keys(stats?.languages || {}).length}</div>
                      <div className="text-sm text-gray-600">Lenguajes</div>
                    </div>
                  </div>
                  
                  {/* Lenguajes principales */}
                  {stats?.topLanguages && stats.topLanguages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Lenguajes principales:</h4>
                      <div className="flex flex-wrap gap-2">
                        {stats.topLanguages.map(({ language, count }) => (
                          <Badge key={language} variant="secondary">
                            {language} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controles de selección */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Seleccionar Elementos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Controles superiores */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedItems.every(item => item.selected) ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Deseleccionar Todo
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Seleccionar Todo
                        </>
                      )}
                    </Button>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                      id="show-selected"
                      checked={showOnlySelected}
                      onCheckedChange={(checked) => setShowOnlySelected(checked === true)}
                    />
                      <Label htmlFor="show-selected" className="text-sm">
                        Solo mostrar seleccionados
                      </Label>
                    </div>
                  </div>
                  
                  {/* Filtro de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Filtrar archivos y carpetas..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Árbol de archivos */}
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredNodes.length > 0 ? (
                      <div className="p-2">
                        {filteredNodes.map(node => renderTreeNode(node))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        {filterText || showOnlySelected ? 'No se encontraron elementos que coincidan con los filtros' : 'No hay elementos para mostrar'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Pestaña de análisis */}
        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Configurar Análisis
              </CardTitle>
              <CardDescription>
                Define el prompt personalizado para analizar los elementos seleccionados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumen de selección */}
              <div className="border border-input rounded-lg bg-secondary p-4">
                <h4 className="font-medium mb-2">Elementos seleccionados para análisis:</h4>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedCount}</span> elementos seleccionados
                  {selectedCount > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {selectedItems
                        .filter(item => item.selected)
                        .slice(0, 10)
                        .map(item => (
                          <div key={item.path} className="flex items-center text-xs">
                            {item.type === 'directory' ? (
                              <Folder className="h-3 w-3 mr-1 text-muted-foreground" />
                            ) : (
                              <File className="h-3 w-3 mr-1 text-muted-foreground" />
                            )}
                            {item.path}
                          </div>
                        ))}
                      {selectedCount > 10 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ... y {selectedCount - 10} elementos más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Prompts predefinidos */}
              <div>
                <Label className="text-base font-medium">Prompts Predefinidos</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Selecciona un tipo de análisis común o crea tu propio prompt personalizado
                </p>
                
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <Select
                      value={selectedPredefinedPrompt}
                      onValueChange={handlePredefinedPromptSelect}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un tipo de análisis..." />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedPrompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{prompt.title}</span>
                              <span className="text-xs text-gray-500">{prompt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPredefinedPrompt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearPredefinedPrompt}
                      className="px-3"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                
                {selectedPredefinedPrompt && (
                  <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center mb-2">
                      <CheckSquare className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-blue-700">
                        {predefinedPrompts.find(p => p.id === selectedPredefinedPrompt)?.title}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600">
                      {predefinedPrompts.find(p => p.id === selectedPredefinedPrompt)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt personalizado */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="custom-prompt">Prompt Personalizado</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCorrectPrompt}
                    disabled={correctingPrompt || !customPrompt.trim()}
                    className="flex items-center gap-2 text-xs"
                  >
                    {correctingPrompt ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Corrigiendo...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3" />
                        Corregir Redacción
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="custom-prompt"
                  placeholder="Ejemplo: Analiza la calidad del código, identifica patrones de diseño utilizados, evalúa la estructura del proyecto y proporciona recomendaciones de mejora..."
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    // Si el usuario modifica manualmente el prompt, limpiar la selección predefinida
                    if (selectedPredefinedPrompt && e.target.value !== predefinedPrompts.find(p => p.id === selectedPredefinedPrompt)?.prompt) {
                      setSelectedPredefinedPrompt('');
                    }
                  }}
                  rows={6}
                  className="mt-1"
                />
                <div className="flex justify-between items-start mt-1">
                  <p className="text-sm text-gray-500">
                    {selectedPredefinedPrompt 
                      ? 'Puedes modificar el prompt seleccionado o escribir uno completamente nuevo'
                      : 'Describe específicamente qué quieres analizar en los elementos seleccionados'
                    }
                  </p>
                  {customPrompt.trim() && (
                     <p className="text-xs text-blue-600 ml-2">
                       💡 Usa el botón &quot;Corregir Redacción&quot; para mejorar tu prompt con IA
                     </p>
                   )}
                </div>
              </div>
              
              {/* Opciones avanzadas */}
              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Opciones Avanzadas
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      showAdvancedOptions ? 'rotate-180' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-content"
                      checked={includeContent}
                      onCheckedChange={(checked) => setIncludeContent(checked === true)}
                    />
                    <Label htmlFor="include-content" className="text-sm">
                      Incluir contenido de archivos en el análisis
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si está deshabilitado, solo se analizará la estructura sin el contenido de los archivos
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Escala de calificación</Label>
                      <Select value={scoreScale} onValueChange={(v) => setScoreScale(v as 'NONE'|'TEN'|'FIVE')}>
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Selecciona la escala" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIVE">0.0–5.0</SelectItem>
                          <SelectItem value="NONE">Sin calificación</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Si seleccionas 0.0–5.0, el análisis pedirá calificar con esa escala.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
              
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing || selectedCount === 0 || !customPrompt.trim()}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Iniciar Análisis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de resultados */}
        <TabsContent value="results" className="space-y-4">
          {analysisResult && (
            <>
              {/* Resumen del análisis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Resultados del Análisis
                    </div>
                    {analysisResult.score !== null && analysisResult.score !== undefined && scoreScale !== 'NONE' && (
                      <Badge variant={(analysisResult.score / (scoreScale === 'FIVE' ? 5 : 10)) >= 0.7 ? 'default' : (analysisResult.score / (scoreScale === 'FIVE' ? 5 : 10)) >= 0.5 ? 'secondary' : 'destructive'}>
                        Puntuación: {analysisResult.score}/{scoreScale === 'FIVE' ? 5 : 10}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Análisis completado el {new Date(analysisResult.analyzedAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información del análisis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-input rounded-lg bg-secondary">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{analysisResult.itemsAnalyzed}</div>
                      <div className="text-sm text-muted-foreground">Elementos Analizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{analysisResult.recommendations.length}</div>
                      <div className="text-sm text-muted-foreground">Recomendaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        <ExternalLink className="h-4 w-4 inline mr-1" />
                        <a href={analysisResult.repositoryUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Ver Repo
                        </a>
                      </div>
                      <div className="text-sm text-muted-foreground">Repositorio</div>
                    </div>
                  </div>
                  
                  {/* Resumen ejecutivo */}
                  <div>
                    <h4 className="font-medium mb-2">Resumen Ejecutivo</h4>
                    <div className="border border-input rounded-lg bg-secondary p-4">
                      <p className="text-sm text-foreground">{analysisResult.summary}</p>
                    </div>
                  </div>
                  
                  {/* Exportación PDF con React PDF */}
                  <div className="flex justify-center pt-4">
                    <PDFDownloadLink
                      document={<ReportDocument analysisResult={analysisResult} repositoryStructure={repositoryStructure!} scoreScale={scoreScale} isDark={isDark} />}
                      fileName={`analisis-repositorio-${(repositoryStructure?.name || 'repo').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`}
                    >
                      {({ loading }) => (
                        <Button variant="outline" className="flex items-center space-x-2" disabled={loading}>
                          <Download className="h-4 w-4" />
                          <span>{loading ? 'Generando...' : 'Exportar Reporte (PDF)'}</span>
                        </Button>
                      )}
                    </PDFDownloadLink>
                  </div>
                </CardContent>
              </Card>

              {/* Análisis detallado */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Detallado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative min-h-[300px]">
                    <MarkdownViewer content={analysisResult.analysis} />
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              {analysisResult.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-secondary text-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 relative min-h-[60px]">
                            <MarkdownViewer content={recommendation} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prompt utilizado */}
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Utilizado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted border border-input p-4 rounded-lg">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{analysisResult.prompt}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}