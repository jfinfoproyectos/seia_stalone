'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { GitBranch, Users, BarChart3, Download, Calendar, FileText, GitCommit, ChevronDown, ChevronUp, ExternalLink, Star } from 'lucide-react';
import Image from 'next/image';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface para el documento PDF con propiedades de autoTable
interface PDFDocumentWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

interface CommitData {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface ContributorStats {
  login: string;
  avatar_url: string;
  html_url: string;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
  percentage: number;
  firstCommit: string;
  lastCommit: string;
  commits: CommitData[];
}

interface ContributorGrade {
  login: string;
  avatar_url: string;
  html_url: string;
  contributionScore: number; // 0-5 basado en porcentaje de contribución
  consistencyScore: number; // 0-5 basado en consistencia temporal
  qualityScore: number; // 0-5 basado en ratio de cambios
  activityScore: number; // 0-5 basado en número de commits
  finalGrade: number; // 0-5 promedio ponderado
  breakdown: {
    contribution: { score: number; weight: number; description: string };
    consistency: { score: number; weight: number; description: string };
    quality: { score: number; weight: number; description: string };
    activity: { score: number; weight: number; description: string };
  };
}

interface RepositoryInfo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function GithubContributorsPage() {
  const { toast } = useToast();
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repositoryInfo, setRepositoryInfo] = useState<RepositoryInfo | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorStats, setContributorStats] = useState<ContributorStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  // const [analyzing, setAnalyzing] = useState(false);
  // const [activeTab, setActiveTab] = useState('overview');
  const [expandedContributors, setExpandedContributors] = useState<Set<string>>(new Set());
  const [selectedContributors, setSelectedContributors] = useState<Set<string>>(new Set());
  const [showContributorSelection, setShowContributorSelection] = useState(false);
  const [contributorGrades, setContributorGrades] = useState<ContributorGrade[]>([]);

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
    if (token) {
      localStorage.setItem('github-token', token);
    } else {
      localStorage.removeItem('github-token');
    }
  };

  // Función para alternar la expansión de commits de un colaborador
  const toggleContributorExpansion = (login: string) => {
    setExpandedContributors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(login)) {
        newSet.delete(login);
      } else {
        newSet.add(login);
      }
      return newSet;
    });
  };

  // Función para alternar la selección de un colaborador
  const toggleContributorSelection = (login: string) => {
    setSelectedContributors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(login)) {
        newSet.delete(login);
      } else {
        newSet.add(login);
      }
      return newSet;
    });
  };

  // Función para seleccionar/deseleccionar todos los colaboradores
  const toggleAllContributors = () => {
    if (selectedContributors.size === contributors.length) {
      setSelectedContributors(new Set());
    } else {
      setSelectedContributors(new Set(contributors.map(c => c.login)));
    }
  };

  // Función para calcular las calificaciones automáticamente
  const calculateGrades = (stats: ContributorStats[]): ContributorGrade[] => {
    if (stats.length === 0) return [];

    // Obtener valores máximos para normalización
    const maxCommits = Math.max(...stats.map(s => s.totalCommits));
    const maxPercentage = Math.max(...stats.map(s => s.percentage));
    const maxChanges = Math.max(...stats.map(s => s.totalChanges));

    return stats.map(contributor => {
      // 1. Puntuación de Contribución (40% del peso) - Basado en porcentaje de contribución
      const contributionScore = Math.min(5, (contributor.percentage / maxPercentage) * 5);
      
      // 2. Puntuación de Actividad (25% del peso) - Basado en número de commits
      const activityScore = Math.min(5, (contributor.totalCommits / maxCommits) * 5);
      
      // 3. Puntuación de Calidad (20% del peso) - Basado en ratio de cambios por commit
      const changesPerCommit = contributor.totalCommits > 0 ? contributor.totalChanges / contributor.totalCommits : 0;
      const maxChangesPerCommit = maxChanges / Math.max(...stats.map(s => s.totalCommits));
      const qualityScore = Math.min(5, (changesPerCommit / maxChangesPerCommit) * 5);
      
      // 4. Puntuación de Consistencia (15% del peso) - Basado en distribución temporal de commits
      let consistencyScore = 3; // Valor base
      if (contributor.commits.length > 1) {
        const dates = contributor.commits.map(c => new Date(c.commit.author.date)).sort();
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const totalDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        const commitsPerDay = contributor.totalCommits / totalDays;
        
        // Penalizar commits muy concentrados en pocos días o muy dispersos
        if (commitsPerDay > 0.1 && commitsPerDay < 2) {
          consistencyScore = 5;
        } else if (commitsPerDay >= 2 || commitsPerDay <= 0.05) {
          consistencyScore = 2;
        }
      }
      
      // Pesos para el cálculo final
      const weights = {
        contribution: 0.4,
        activity: 0.25,
        quality: 0.2,
        consistency: 0.15
      };
      
      // Calcular calificación final ponderada
      const finalGrade = (
        contributionScore * weights.contribution +
        activityScore * weights.activity +
        qualityScore * weights.quality +
        consistencyScore * weights.consistency
      );
      
      return {
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        html_url: contributor.html_url,
        contributionScore: Math.round(contributionScore * 10) / 10,
        consistencyScore: Math.round(consistencyScore * 10) / 10,
        qualityScore: Math.round(qualityScore * 10) / 10,
        activityScore: Math.round(activityScore * 10) / 10,
        finalGrade: Math.round(finalGrade * 10) / 10,
        breakdown: {
          contribution: {
            score: Math.round(contributionScore * 10) / 10,
            weight: weights.contribution,
            description: `${contributor.percentage.toFixed(1)}% del total de contribuciones`
          },
          activity: {
            score: Math.round(activityScore * 10) / 10,
            weight: weights.activity,
            description: `${contributor.totalCommits} commits realizados`
          },
          quality: {
            score: Math.round(qualityScore * 10) / 10,
            weight: weights.quality,
            description: `${Math.round(changesPerCommit)} cambios promedio por commit`
          },
          consistency: {
            score: Math.round(consistencyScore * 10) / 10,
            weight: weights.consistency,
            description: 'Distribución temporal de commits'
          }
        }
      };
    }).sort((a, b) => b.finalGrade - a.finalGrade);
  };

  // Función para generar reporte PDF de calificaciones
  const generateGradesPDF = () => {
    if (!contributorGrades.length || !repositoryInfo) return;
    
    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text('Reporte de Calificaciones - GitHub Contributors', 14, 20);
    
    // Información del repositorio
    doc.setFontSize(12);
    doc.text(`Repositorio: ${repositoryInfo.name}`, 14, 35);
    doc.text(`Propietario: ${repositoryInfo.full_name.split('/')[0]}`, 14, 45);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 55);
    
    // Sistema de calificación
    doc.setFontSize(14);
    doc.text('Sistema de Calificación:', 14, 70);
    doc.setFontSize(10);
    doc.text('• Contribución (40%): Porcentaje de commits del colaborador', 14, 80);
    doc.text('• Actividad (25%): Número total de commits realizados', 14, 87);
    doc.text('• Calidad (20%): Promedio de cambios por commit', 14, 94);
    doc.text('• Consistencia (15%): Regularidad en las contribuciones', 14, 101);
    
    // Tabla de calificaciones
    const tableData = contributorGrades.map(grade => [
      grade.login,
      grade.contributionScore.toString(),
      grade.activityScore.toString(),
      grade.qualityScore.toString(),
      grade.consistencyScore.toString(),
      grade.finalGrade.toString()
    ]);
    
    autoTable(doc, {
      startY: 115,
      head: [['Colaborador', 'Contribución', 'Actividad', 'Calidad', 'Consistencia', 'Calificación Final']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'center', fillColor: [240, 248, 255] }
      }
    });
    
    let currentY = (doc as PDFDocumentWithAutoTable).lastAutoTable?.finalY ? (doc as PDFDocumentWithAutoTable).lastAutoTable!.finalY + 15 : 180;
    
    // Detalles de cada colaborador
    doc.setFontSize(14);
    doc.text('Detalles por Colaborador:', 14, currentY);
    currentY += 10;
    
    contributorGrades.forEach((grade, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${grade.login} (${grade.finalGrade}/5.0)`, 14, currentY);
      currentY += 8;
      
      doc.setFontSize(9);
      doc.text(`• Contribución: ${grade.breakdown.contribution.description}`, 20, currentY);
      currentY += 5;
      doc.text(`• Actividad: ${grade.breakdown.activity.description}`, 20, currentY);
      currentY += 5;
      doc.text(`• Calidad: ${grade.breakdown.quality.description}`, 20, currentY);
      currentY += 5;
      doc.text(`• Consistencia: ${grade.breakdown.consistency.description}`, 20, currentY);
      currentY += 10;
    });
    
    // Guardar el PDF
    const fileName = `reporte-calificaciones-${repositoryInfo.name}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Función para extraer owner y repo de la URL
  const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    // Limpiar la URL
    let cleanUrl = url.trim();
    
    // Remover .git del final si existe
    if (cleanUrl.endsWith('.git')) {
      cleanUrl = cleanUrl.slice(0, -4);
    }
    
    // Si ya está en formato owner/repo
    if (cleanUrl.includes('/') && !cleanUrl.includes('github.com')) {
      const parts = cleanUrl.split('/');
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    }
    
    // Si es una URL completa de GitHub
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    
    return null;
  };

  // Función para obtener información del repositorio
  const fetchRepositoryInfo = async (owner: string, repo: string): Promise<RepositoryInfo> => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error al obtener información del repositorio: ${response.status}`);
    }

    return response.json();
  };

  // Función para obtener contribuidores
  const fetchContributors = async (owner: string, repo: string): Promise<Contributor[]> => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error al obtener contribuidores: ${response.status}`);
    }

    return response.json();
  };

  // Función para obtener commits de un contribuidor
  const fetchContributorCommits = async (owner: string, repo: string, author: string): Promise<CommitData[]> => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    let allCommits: CommitData[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?author=${author}&page=${page}&per_page=${perPage}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Error al obtener commits: ${response.status}`);
      }

      const commits = await response.json();
      if (commits.length === 0) break;

      allCommits = [...allCommits, ...commits];
      page++;

      // Limitar a 1000 commits por contribuidor para evitar problemas de rendimiento
      if (allCommits.length >= 1000) break;
    }

    return allCommits;
  };

  // Función para obtener estadísticas detalladas de un commit
  const fetchCommitStats = async (owner: string, repo: string, sha: string): Promise<{ additions: number; deletions: number; total: number }> => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
        headers,
      });

      if (!response.ok) {
        return { additions: 0, deletions: 0, total: 0 };
      }

      const commitData = await response.json();
      return {
        additions: commitData.stats?.additions || 0,
        deletions: commitData.stats?.deletions || 0,
        total: commitData.stats?.total || 0,
      };
    } catch {
      return { additions: 0, deletions: 0, total: 0 };
    }
  };

  // Función principal para analizar contribuciones
  const analyzeContributions = async () => {
    if (!repoUrl.trim()) {
      setError('Por favor, ingresa una URL de repositorio válida');
      return;
    }

    const parsedRepo = parseRepoUrl(repoUrl);
    if (!parsedRepo) {
      setError('URL de repositorio inválida. Formato esperado: https://github.com/owner/repo o owner/repo');
      return;
    }

    setLoading(true);
    setError('');
    setContributors([]);
    setContributorStats([]);
    setRepositoryInfo(null);

    try {
      // Obtener información del repositorio
      const repoInfo = await fetchRepositoryInfo(parsedRepo.owner, parsedRepo.repo);
      setRepositoryInfo(repoInfo);

      // Obtener contribuidores
      const contributorsData = await fetchContributors(parsedRepo.owner, parsedRepo.repo);
      setContributors(contributorsData);
      
      // Seleccionar todos los colaboradores por defecto
      setSelectedContributors(new Set(contributorsData.map(c => c.login)));
      
      // Mostrar la selección de colaboradores
      setShowContributorSelection(true);

      toast({
        title: "Colaboradores encontrados",
        description: `Se encontraron ${contributorsData.length} colaboradores. Selecciona los que deseas analizar.`,
      });

    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          setError(`❌ Repositorio '${parsedRepo.owner}/${parsedRepo.repo}' no encontrado. Verifica que:\n• El nombre del repositorio sea correcto\n• El repositorio sea público\n• El formato sea owner/repo (ej: facebook/react)`);
        } else if (err.message.includes('403')) {
          setError('❌ Acceso denegado. El repositorio puede ser privado o necesitas un token de GitHub.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error desconocido');
      }
      toast({
        title: "Error",
        description: "Error al analizar el repositorio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar el análisis detallado con colaboradores seleccionados
  const startDetailedAnalysis = async () => {
    if (selectedContributors.size === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un colaborador para analizar.",
        variant: "destructive",
      });
      return;
    }

    const parsedRepo = parseRepoUrl(repoUrl);
    if (!parsedRepo) return;

    // Filtrar solo los colaboradores seleccionados
    const selectedContributorsData = contributors.filter(c => selectedContributors.has(c.login));
    
    setShowContributorSelection(false);
    
    toast({
      title: "Análisis iniciado",
      description: `Analizando ${selectedContributorsData.length} colaboradores seleccionados...`,
    });

    // Obtener estadísticas detalladas solo de los colaboradores seleccionados
    await fetchDetailedStats(parsedRepo.owner, parsedRepo.repo, selectedContributorsData);
  };

  // Función para obtener estadísticas detalladas de todos los contribuidores
  const fetchDetailedStats = async (owner: string, repo: string, contributorsData: Contributor[]) => {
    setLoadingStats(true);
    setProgress({ current: 0, total: contributorsData.length });

    const stats: ContributorStats[] = [];
    let totalChanges = 0;

    for (let i = 0; i < contributorsData.length; i++) {
      const contributor = contributorsData[i];
      setProgress({ current: i + 1, total: contributorsData.length });

      try {
        // Obtener commits del contribuidor
        const commits = await fetchContributorCommits(owner, repo, contributor.login);
        
        let totalAdditions = 0;
        let totalDeletions = 0;
        let totalCommitChanges = 0;
        
        // Obtener estadísticas de algunos commits (limitamos para evitar demasiadas requests)
        const commitsToAnalyze = commits.slice(0, Math.min(50, commits.length));
        
        for (const commit of commitsToAnalyze) {
          const stats = await fetchCommitStats(owner, repo, commit.sha);
          totalAdditions += stats.additions;
          totalDeletions += stats.deletions;
          totalCommitChanges += stats.total;
          
          // Agregar estadísticas al commit
          commit.stats = stats;
          
          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const contributorStat: ContributorStats = {
          login: contributor.login,
          avatar_url: contributor.avatar_url,
          html_url: contributor.html_url,
          totalCommits: commits.length,
          totalAdditions,
          totalDeletions,
          totalChanges: totalCommitChanges,
          percentage: 0, // Se calculará después
          firstCommit: commits.length > 0 ? commits[commits.length - 1].commit.author.date : '',
          lastCommit: commits.length > 0 ? commits[0].commit.author.date : '',
          commits: commits.slice(0, 10), // Solo guardamos los primeros 10 commits para mostrar
        };

        stats.push(contributorStat);
        totalChanges += totalCommitChanges;

      } catch (error) {
        console.error(`Error al obtener estadísticas para ${contributor.login}:`, error);
        
        // Agregar contribuidor con datos básicos si hay error
        const contributorStat: ContributorStats = {
          login: contributor.login,
          avatar_url: contributor.avatar_url,
          html_url: contributor.html_url,
          totalCommits: contributor.contributions,
          totalAdditions: 0,
          totalDeletions: 0,
          totalChanges: 0,
          percentage: 0,
          firstCommit: '',
          lastCommit: '',
          commits: [],
        };
        
        stats.push(contributorStat);
      }
    }

    // Calcular porcentajes
    stats.forEach(stat => {
      stat.percentage = totalChanges > 0 ? (stat.totalChanges / totalChanges) * 100 : 0;
    });

    // Ordenar por total de cambios
    stats.sort((a, b) => b.totalChanges - a.totalChanges);

    setContributorStats(stats);
    
    // Calcular calificaciones automáticamente
    const grades = calculateGrades(stats);
    setContributorGrades(grades);
    
    setLoadingStats(false);
    
    toast({
      title: "Análisis completado",
      description: `Se analizaron ${stats.length} contribuidores exitosamente.`,
    });
  };

  // Función para exportar datos a JSON
  const exportToJSON = () => {
    const exportData = {
      repository: repositoryInfo,
      contributors: contributorStats,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repositoryInfo?.name || 'repository'}-contributors-analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Preparar datos para el gráfico de pastel
  const pieChartData = contributorStats.map((stat, index) => ({
    name: stat.login,
    value: stat.percentage,
    color: COLORS[index % COLORS.length],
  }));

  // Preparar datos para el gráfico de barras
  const barChartData = contributorStats.slice(0, 10).map(stat => ({
    name: stat.login,
    commits: stat.totalCommits,
    additions: stat.totalAdditions,
    deletions: stat.totalDeletions,
    changes: stat.totalChanges,
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Analizador de Contribuciones GitHub</h1>
          <p className="text-muted-foreground">
            Analiza las contribuciones de todos los colaboradores en un repositorio
          </p>
        </div>
      </div>

      {/* Información sobre límites de API */}
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
         <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Información sobre la API de GitHub</h3>
         <p className="text-sm text-blue-700 mb-2">
           <strong>Sin token:</strong> 60 solicitudes por hora | <strong>Con token:</strong> 5,000 solicitudes por hora
         </p>
         <div className="flex items-center gap-2 mb-2">
           <button
             type="button"
             onClick={() => setShowTokenInput(!showTokenInput)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
           >
             🔑 {githubToken ? '✓ Token configurado' : 'Configurar Token de GitHub'}
             {githubToken && <span className="text-xs bg-green-500 px-2 py-1 rounded-full">Guardado</span>}
           </button>
         </div>
         
         {showTokenInput && (
           <div className="bg-white border border-blue-200 rounded p-3 mb-2">
             <label className="block text-sm font-medium text-blue-800 mb-1">
               Personal Access Token (Classic):
             </label>
             <div className="flex gap-2">
               <input
                 type="password"
                 value={githubToken}
                 onChange={(e) => updateGithubToken(e.target.value)}
                 placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                 className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
               />
               {githubToken && (
                 <button
                   onClick={() => updateGithubToken('')}
                   className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                   title="Limpiar token"
                 >
                   🗑️
                 </button>
               )}
             </div>
             <p className="text-xs text-blue-600 mt-1">
               Crea tu token en: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub Settings → Developer settings → Personal access tokens</a>
             </p>
             <p className="text-xs text-gray-500 mt-1">
               🔒 El token se guarda localmente en tu navegador y persiste entre sesiones.
             </p>
           </div>
         )}
       </div>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Configuración del Repositorio
          </CardTitle>
          <CardDescription>
            Ingresa la URL del repositorio de GitHub que deseas analizar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">URL del Repositorio</Label>
            <Input
              id="repo-url"
              placeholder="URL completa o owner/repo (ej: https://github.com/vercel/next.js)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={analyzeContributions} 
            disabled={loading || loadingStats}
            className="w-full"
          >
            {loading ? 'Analizando...' : 'Analizar Contribuciones'}
          </Button>
        </CardContent>
      </Card>

      {/* Información del Repositorio */}
      {repositoryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Repositorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{repositoryInfo.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lenguaje</p>
                <p className="font-medium">{repositoryInfo.language || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estrellas</p>
                <p className="font-medium">{repositoryInfo.stargazers_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forks</p>
                <p className="font-medium">{repositoryInfo.forks_count}</p>
              </div>
            </div>
            {repositoryInfo.description && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{repositoryInfo.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selección de Colaboradores */}
      {showContributorSelection && contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleccionar Colaboradores para Analizar
            </CardTitle>
            <CardDescription>
              Selecciona los colaboradores que deseas incluir en el análisis detallado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Checkbox
                   id="select-all"
                   checked={selectedContributors.size === contributors.length}
                   onCheckedChange={toggleAllContributors}
                 />
                 <Label htmlFor="select-all" className="font-medium">
                   Seleccionar todos ({contributors.length})
                 </Label>
               </div>
               <Badge variant="outline">
                 {selectedContributors.size} seleccionados
               </Badge>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {contributors.map((contributor) => (
                <div
                   key={contributor.id}
                   className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                 >
                   <Checkbox
                     id={`contributor-${contributor.id}`}
                     checked={selectedContributors.has(contributor.login)}
                     onCheckedChange={() => toggleContributorSelection(contributor.login)}
                   />
                   <Image
                     src={contributor.avatar_url}
                     alt={contributor.login}
                     width={32}
                     height={32}
                     className="rounded-full"
                   />
                   <div className="flex-1 min-w-0">
                     <Label
                       htmlFor={`contributor-${contributor.id}`}
                       className="font-medium cursor-pointer truncate block"
                     >
                       {contributor.login}
                     </Label>
                     <p className="text-xs text-muted-foreground">
                       {contributor.contributions} contribuciones
                     </p>
                   </div>
                 </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={startDetailedAnalysis}
                disabled={selectedContributors.size === 0 || loadingStats}
                className="flex-1"
              >
                Analizar Colaboradores Seleccionados ({selectedContributors.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowContributorSelection(false);
                  setContributors([]);
                  setRepositoryInfo(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso de análisis */}
      {loadingStats && (
        <Card>
          <CardHeader>
            <CardTitle>Analizando Contribuidores</CardTitle>
            <CardDescription>
              Obteniendo estadísticas detalladas de cada contribuidor...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {contributorStats.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="grades">Calificación</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
          </TabsList>

          {/* Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resumen de Contribuciones
                  </span>
                  <Badge variant="secondary">
                    {contributorStats.length} contribuidores
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {contributorStats.reduce((sum, stat) => sum + stat.totalCommits, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Commits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {contributorStats.reduce((sum, stat) => sum + stat.totalAdditions, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Líneas Agregadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">
                      {contributorStats.reduce((sum, stat) => sum + stat.totalDeletions, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Líneas Eliminadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {contributorStats.reduce((sum, stat) => sum + stat.totalChanges, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Cambios</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {contributorStats.slice(0, 5).map((stat) => (
                    <div key={stat.login} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <Image 
                          src={stat.avatar_url}
                          alt={stat.login}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium">{stat.login}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.totalCommits} commits
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {stat.percentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.totalChanges.toLocaleString()} cambios
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gráficos */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pastel */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Contribuciones</CardTitle>
                  <CardDescription>
                    Porcentaje de contribución por colaborador
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Contribución']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Barras */}
              <Card>
                <CardHeader>
                  <CardTitle>Commits por Contribuidor</CardTitle>
                  <CardDescription>
                    Top 10 contribuidores por número de commits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="commits" fill="#8884d8" name="Commits" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Cambios */}
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Cambios de Código</CardTitle>
                <CardDescription>
                  Líneas agregadas vs eliminadas por contribuidor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="additions" fill="#00C49F" name="Líneas Agregadas" />
                    <Bar dataKey="deletions" fill="#FF8042" name="Líneas Eliminadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalles */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6">
              {contributorStats.map((stat) => (
                <Card key={stat.login}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Image 
                        src={stat.avatar_url} 
                        alt={stat.login}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span>{stat.login}</span>
                      <Badge variant="outline">
                        {stat.percentage.toFixed(1)}% del proyecto
                      </Badge>
                      <a
                        href={stat.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver perfil
                      </a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Commits</p>
                        <p className="text-lg font-bold">{stat.totalCommits}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Líneas Agregadas</p>
                        <p className="text-lg font-bold text-green-500">
                          +{stat.totalAdditions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Líneas Eliminadas</p>
                        <p className="text-lg font-bold text-red-500">
                          -{stat.totalDeletions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cambios</p>
                        <p className="text-lg font-bold">
                          {stat.totalChanges.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {stat.firstCommit && stat.lastCommit && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Primer Commit</p>
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(stat.firstCommit).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Último Commit</p>
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(stat.lastCommit).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {stat.commits.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">
                            Commits ({stat.commits.length})
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleContributorExpansion(stat.login)}
                            className="h-6 px-2"
                          >
                            {expandedContributors.has(stat.login) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Contraer
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Ver todos
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {(expandedContributors.has(stat.login) ? stat.commits : stat.commits.slice(0, 3)).map((commit) => (
                             <div key={commit.sha} className="text-sm border-l-2 border-gray-200 pl-3 py-2">
                               <div className="flex items-center gap-2 mb-1">
                                 <GitCommit className="h-3 w-3" />
                                 <a
                                   href={`${repositoryInfo?.html_url}/commit/${commit.sha}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="font-mono text-xs bg-gray-100 px-1 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
                                 >
                                   {commit.sha.substring(0, 7)}
                                 </a>
                                 <span className="text-muted-foreground text-xs">
                                   {new Date(commit.commit.author.date).toLocaleDateString()}
                                 </span>
                                 <span className="text-muted-foreground text-xs">
                                   {new Date(commit.commit.author.date).toLocaleTimeString()}
                                 </span>
                                 <a
                                   href={`${repositoryInfo?.html_url}/commit/${commit.sha}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                 >
                                   <ExternalLink className="h-3 w-3" />
                                   Ver commit
                                 </a>
                               </div>
                               <p className="mt-1 font-medium">{commit.commit.message.split('\n')[0]}</p>
                               {commit.commit.message.split('\n').length > 1 && expandedContributors.has(stat.login) && (
                                 <p className="text-xs text-muted-foreground mt-1">
                                   {commit.commit.message.split('\n').slice(1).join('\n')}
                                 </p>
                               )}
                               {commit.stats && (
                                 <div className="flex items-center gap-4 mt-2 text-xs">
                                   <span className="text-green-600 font-medium">
                                     +{commit.stats.additions} líneas
                                   </span>
                                   <span className="text-red-600 font-medium">
                                     -{commit.stats.deletions} líneas
                                   </span>
                                   <span className="text-muted-foreground">
                                     {commit.stats.total} cambios totales
                                   </span>
                                 </div>
                               )}
                             </div>
                           ))}
                          {!expandedContributors.has(stat.login) && stat.commits.length > 3 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-muted-foreground">
                                ... y {stat.commits.length - 3} commits más
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calificación */}
          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Sistema de Calificación
                </CardTitle>
                <CardDescription>
                  Evaluación automática de colaboradores basada en criterios objetivos (escala 0-5)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Explicación del sistema */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Criterios de Evaluación:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">• Contribución (40%):</span> Porcentaje del total de cambios
                      </div>
                      <div>
                        <span className="font-medium">• Actividad (25%):</span> Número de commits realizados
                      </div>
                      <div>
                        <span className="font-medium">• Calidad (20%):</span> Promedio de cambios por commit
                      </div>
                      <div>
                        <span className="font-medium">• Consistencia (15%):</span> Distribución temporal de commits
                      </div>
                    </div>
                  </div>

                  {/* Lista de calificaciones */}
                  <div className="space-y-4">
                    {contributorGrades.map((grade, index) => {
                      const getGradeColor = (score: number) => {
                        if (score >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
                        if (score >= 3.5) return 'text-blue-600 bg-blue-50 border-blue-200';
                        if (score >= 2.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                        if (score >= 1.5) return 'text-orange-600 bg-orange-50 border-orange-200';
                        return 'text-red-600 bg-red-50 border-red-200';
                      };

                      const getGradeLabel = (score: number) => {
                        if (score >= 4.5) return 'Excelente';
                        if (score >= 3.5) return 'Muy Bueno';
                        if (score >= 2.5) return 'Bueno';
                        if (score >= 1.5) return 'Regular';
                        return 'Necesita Mejorar';
                      };

                      return (
                        <Card key={grade.login} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={grade.avatar_url}
                                  alt={grade.login}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{grade.login}</h3>
                                    <span className="text-gray-500">#{index + 1}</span>
                                  </div>
                                  <a
                                    href={grade.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                  >
                                    Ver perfil
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getGradeColor(grade.finalGrade)}`}>
                                  <Star className="h-4 w-4 mr-1" />
                                  {grade.finalGrade}/5
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {getGradeLabel(grade.finalGrade)}
                                </div>
                              </div>
                            </div>

                            {/* Desglose detallado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">Contribución</span>
                                  <span className="text-sm font-bold">{grade.breakdown.contribution.score}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(grade.breakdown.contribution.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {grade.breakdown.contribution.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Peso: {(grade.breakdown.contribution.weight * 100).toFixed(0)}%
                                </div>
                              </div>

                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">Actividad</span>
                                  <span className="text-sm font-bold">{grade.breakdown.activity.score}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${(grade.breakdown.activity.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {grade.breakdown.activity.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Peso: {(grade.breakdown.activity.weight * 100).toFixed(0)}%
                                </div>
                              </div>

                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">Calidad</span>
                                  <span className="text-sm font-bold">{grade.breakdown.quality.score}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-600 h-2 rounded-full"
                                    style={{ width: `${(grade.breakdown.quality.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {grade.breakdown.quality.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Peso: {(grade.breakdown.quality.weight * 100).toFixed(0)}%
                                </div>
                              </div>

                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">Consistencia</span>
                                  <span className="text-sm font-bold">{grade.breakdown.consistency.score}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${(grade.breakdown.consistency.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {grade.breakdown.consistency.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Peso: {(grade.breakdown.consistency.weight * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exportar */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Datos
                </CardTitle>
                <CardDescription>
                  Descarga los resultados del análisis en diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportToJSON} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como JSON
                </Button>
                
                <Button 
                  onClick={generateGradesPDF} 
                  className="w-full" 
                  variant="outline"
                  disabled={!contributorGrades.length}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar Reporte de Calificaciones (PDF)
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Archivo JSON incluye:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Información completa del repositorio</li>
                    <li>Estadísticas detalladas de cada contribuidor</li>
                    <li>Historial de commits analizados</li>
                    <li>Métricas de contribución y porcentajes</li>
                  </ul>
                  
                  <p className="mt-4"><strong>Reporte PDF incluye:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sistema de calificación con criterios objetivos</li>
                    <li>Tabla resumen de calificaciones por colaborador</li>
                    <li>Detalles de puntuación por cada criterio</li>
                    <li>Información del repositorio y fecha de generación</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}