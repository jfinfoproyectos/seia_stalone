import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScheduleAnalysisResult, RiskPredictionResult, QuestionBiasAnalysisResult, ParticipationAnalysisResult, PlagiarismPair, PlagiarismAnalysisResult, PersonalizedRecommendationResult } from './gemini-schedule-analysis';

// Interface to properly type the jsPDF instance with the jspdf-autotable plugin property
interface DocWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
  autoTable: (...args: unknown[]) => void;
}

interface AttemptData {
  evaluation: {
    title: string;
  };
  submissions: {
    firstName: string;
    lastName: string;
    score: number | null;
  }[];
}

interface QuestionAnalysisData {
  text: string;
  type: string;
  averageScore: number;
  stdDev?: number;
}

export function generatePdfReport(
  analysis: ScheduleAnalysisResult,
  attemptData: AttemptData,
  questionAnalysis: QuestionAnalysisData[],
  riskPrediction?: RiskPredictionResult,
  questionBias?: QuestionBiasAnalysisResult,
  participationAnalysis?: ParticipationAnalysisResult,
  plagiarismPairsText?: PlagiarismPair[],
  plagiarismAnalysisText?: PlagiarismAnalysisResult,
  plagiarismPairsCode?: PlagiarismPair[],
  plagiarismAnalysisCode?: PlagiarismAnalysisResult,
  personalizedRecommendations?: PersonalizedRecommendationResult[],
  sentimentAnalysis?: import('./gemini-schedule-analysis').SentimentAnalysisResult,
  difficultyHeatmap?: import('./gemini-schedule-analysis').DifficultyHeatmapResult,
  selectedSections?: Record<string, boolean>
) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let y = 15;

  // Helper to add text and manage y position
  const addText = (text: string, x: number, startY: number, options?: Record<string, unknown>) => {
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, x, startY, options);
    return startY + (doc.getTextDimensions(splitText).h);
  };

  // Title y resumen general
  if (selectedSections?.general) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    y = addText(`Reporte de Análisis IA: ${analysis.evaluationTitle}`, 14, y) + 5;

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Resumen General', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText(analysis.overallSummary, 14, y) + 5;
  }

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 10) {
      doc.addPage();
      y = 15;
    }
  };

  const addSection = (title: string, items: string[]) => {
    checkPageBreak(10 + items.length * 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    y = addText(title, 14, y) + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      y = addText(`- ${item}`, 18, y);
    });
    y += 5;
  };

  if (selectedSections?.general) {
    addSection('Fortalezas Clave', analysis.strengths);
    addSection('Áreas de Mejora', analysis.areasForImprovement);
    addSection('Observaciones Clave', analysis.keyObservations);
  }

  // Sección de predicción de riesgo
  if (riskPrediction) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Predicción de riesgo de bajo rendimiento', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (riskPrediction.atRiskStudents.length > 0) {
      y = addText('Estudiantes en riesgo:', 16, y);
      riskPrediction.atRiskStudents.forEach(name => {
        y = addText(`- ${name}`, 20, y);
      });
    } else {
      y = addText('No se identificaron estudiantes en riesgo significativo.', 16, y);
    }
    y = addText('Explicación:', 16, y) + 2;
    y = addText(riskPrediction.explanation, 20, y) + 5;
  }

  // Sección de sesgos en preguntas
  if (questionBias && selectedSections?.bias) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Detección de sesgos en preguntas', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (questionBias.biasedQuestions.length > 0) {
      questionBias.biasedQuestions.forEach((q, i) => {
        y = addText(`Pregunta ${i + 1}:`, 16, y);
        y = addText(`Motivo: ${q.reason}`, 20, y) + 2;
      });
    } else {
      y = addText('No se detectaron preguntas potencialmente sesgadas.', 16, y);
    }
    y = addText('Explicación general:', 16, y) + 2;
    y = addText(questionBias.explanation, 20, y) + 5;
  }

  // Análisis de Participación y Compromiso
  if (participationAnalysis && selectedSections?.participation) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Análisis de Participación y Compromiso', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText('Resumen:', 16, y) + 2;
    y = addText(participationAnalysis.summary, 20, y) + 2;
    if (participationAnalysis.lowEngagementStudents.length > 0) {
      y = addText('Estudiantes con bajo compromiso o dificultades:', 16, y);
      participationAnalysis.lowEngagementStudents.forEach(name => {
        y = addText(`- ${name}`, 20, y);
      });
    } else {
      y = addText('No se identificaron estudiantes con bajo compromiso según el análisis.', 16, y);
    }
    y += 5;
  }

  // Tabla de análisis por pregunta
  if (selectedSections?.tablaAnalisisPregunta) {
    checkPageBreak(20);
    doc.addPage();
    y = 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis por Pregunta', 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Tipo', 'Promedio', 'Desviación']],
      body: questionAnalysis.map((q, i) => [
        i + 1,
        q.type,
        q.averageScore.toFixed(1),
        q.stdDev !== undefined ? q.stdDev.toFixed(2) : 'N/A',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    y = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;
  }

  // Tabla de ranking de participantes
  if (selectedSections?.tablaRanking) {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ranking de Participantes', 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Estudiante', 'Calificación']],
      body: attemptData.submissions.map((s, i) => [
        i + 1,
        `${s.firstName} ${s.lastName}`,
        s.score?.toFixed(1) ?? 'N/A',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // Análisis de Plagio/Similitud en Texto
  if (plagiarismPairsText && plagiarismPairsText.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Análisis de Plagio y Similitud en Texto', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (plagiarismAnalysisText) {
      y = addText('Resumen IA:', 16, y) + 2;
      y = addText(plagiarismAnalysisText.summary, 20, y) + 2;
    }

    // Extraer nombres únicos de estudiantes
    const studentNames = new Set<string>();
    plagiarismPairsText.forEach(pair => {
      studentNames.add(pair.studentA);
      studentNames.add(pair.studentB);
    });

    y = addText('Estudiantes con Alta Similitud:', 16, y) + 2;
    Array.from(studentNames).forEach(name => {
      y = addText(`- ${name}`, 20, y);
    });
    y += 5;
  }

  // Nuevas secciones para estudiantes destacados y a mejorar
  if (analysis.topStudents && analysis.topStudents.length > 0) {
    addSection('Estudiantes Destacados', analysis.topStudents);
  }
  if (analysis.studentsToImprove && analysis.studentsToImprove.length > 0) {
    addSection('Estudiantes a Mejorar', analysis.studentsToImprove);
  }

  if (selectedSections?.general) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    y = addText('Recomendaciones', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText(analysis.recommendations, 14, y) + 10;
  }

  // Sección de conclusiones
  if (selectedSections?.general && analysis.conclusions) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    y = addText('Conclusiones', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText(analysis.conclusions, 14, y) + 10;
  }

  // Sección de recomendaciones personalizadas por estudiante
  if (personalizedRecommendations && personalizedRecommendations.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Recomendaciones Personalizadas por Estudiante', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    personalizedRecommendations.forEach(rec => {
      checkPageBreak(20);
      y = addText(`Estudiante: ${rec.studentName}`, 16, y);
      y = addText(rec.recommendations, 20, y) + 5;
    });
    y += 5;
  }

  // Sección de análisis de sentimiento en respuestas abiertas
  if (sentimentAnalysis && selectedSections?.sentiment) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Análisis de Sentimiento en Respuestas Abiertas', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText(sentimentAnalysis.summary, 14, y) + 5;
    // Tabla de casos relevantes
    if (sentimentAnalysis.relevantCases && sentimentAnalysis.relevantCases.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Estudiante', 'Sentimiento', 'Cita Relevante', 'Explicación']],
        body: sentimentAnalysis.relevantCases.map(d => [
          d.studentName,
          d.sentiment,
          d.quote,
          d.explanation,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });
      y = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;
    }
  }

  // Sección de Mapa de Calor de Dificultad por Temas
  if (difficultyHeatmap && selectedSections?.difficultyHeatmap) {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    y = addText('Mapa de Calor de Dificultad por Temas', 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addText(difficultyHeatmap.summary, 14, y) + 5;
    
    // Tabla de temas
    if (difficultyHeatmap.topics && difficultyHeatmap.topics.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Tema', 'Calificación Promedio', 'Dificultad', 'Feedback']],
        body: difficultyHeatmap.topics.map(t => [
          t.topic,
          t.averageScore.toFixed(1),
          t.difficulty,
          t.feedback,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });
      y = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;
    }
  }

  doc.save(`reporte_ia_${analysis.evaluationTitle.replace(/\s/g, '_')}.pdf`);
}