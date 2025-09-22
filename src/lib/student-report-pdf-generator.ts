import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface para extender jsPDF con autoTable
interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

// Interface para los datos del reporte del estudiante
export interface StudentReportData {
  studentName: string;
  evaluationTitle: string;
  grade: string;
  date: string;
  feedback?: string;
  questions?: {
    question: string;
    answer: string;
    score?: number;
    maxScore?: number;
    feedback?: string;
  }[];
  totalScore?: number;
  maxTotalScore?: number;
  duration?: string;
  submissionTime?: string;
}

/**
 * Genera un reporte PDF completo para un estudiante
 * @param reportData Datos del reporte del estudiante
 * @returns void (descarga el PDF automáticamente)
 */
export function generateStudentReportPDF(reportData: StudentReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let y = 20;

  // Función auxiliar para verificar si necesitamos una nueva página
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Encabezado del reporte
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Evaluación', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 15;

  // Información del estudiante
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Estudiante', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${reportData.studentName}`, 25, y);
  y += 8;
  doc.text(`Evaluación: ${reportData.evaluationTitle}`, 25, y);
  y += 8;
  doc.text(`Fecha: ${reportData.date}`, 25, y);
  y += 8;
  
  if (reportData.submissionTime) {
    doc.text(`Hora de envío: ${reportData.submissionTime}`, 25, y);
    y += 8;
  }
  
  if (reportData.duration) {
    doc.text(`Duración: ${reportData.duration}`, 25, y);
    y += 8;
  }

  y += 10;

  // Calificación
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Calificación', 20, y);
  y += 10;

  // Crear tabla de calificación
  const gradeData = [];
  if (reportData.totalScore !== undefined && reportData.maxTotalScore !== undefined) {
    gradeData.push(['Puntuación Total', `${reportData.totalScore} / ${reportData.maxTotalScore}`]);
  }
  gradeData.push(['Nota Final', reportData.grade !== 'N/A' ? `${parseFloat(reportData.grade).toFixed(1)} / 5.0` : 'Sin calificar']);

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: gradeData,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 11,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'center' }
    }
  });

  y = (doc as DocWithAutoTable).lastAutoTable?.finalY ? (doc as DocWithAutoTable).lastAutoTable!.finalY + 15 : y + 40;

  // Preguntas y respuestas (si están disponibles)
  if (reportData.questions && reportData.questions.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Respuestas', 20, y);
    y += 15;

    reportData.questions.forEach((q, index) => {
      checkPageBreak(60);
      
      // Pregunta
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pregunta ${index + 1}:`, 25, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(q.question, pageWidth - 50);
      doc.text(questionLines, 25, y);
      y += questionLines.length * 6 + 5;
      
      // Respuesta
      doc.setFont('helvetica', 'bold');
      doc.text('Respuesta:', 25, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      const answerLines = doc.splitTextToSize(q.answer || 'Sin respuesta', pageWidth - 50);
      doc.text(answerLines, 25, y);
      y += answerLines.length * 6 + 5;
      
      // Puntuación (si está disponible)
      if (q.score !== undefined && q.maxScore !== undefined) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Puntuación: ${q.score} / ${q.maxScore}`, 25, y);
        y += 8;
      }
      
      // Retroalimentación (si está disponible)
      if (q.feedback) {
        doc.setFont('helvetica', 'bold');
        doc.text('Retroalimentación:', 25, y);
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        const feedbackLines = doc.splitTextToSize(q.feedback, pageWidth - 50);
        doc.text(feedbackLines, 25, y);
        y += feedbackLines.length * 6;
      }
      
      y += 10;
      
      // Línea separadora entre preguntas
      if (index < reportData.questions!.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(25, y, pageWidth - 25, y);
        y += 10;
      }
    });
  }

  // Retroalimentación general (si está disponible)
  if (reportData.feedback) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Retroalimentación General', 20, y);
    y += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const feedbackLines = doc.splitTextToSize(reportData.feedback, pageWidth - 40);
    doc.text(feedbackLines, 25, y);
    y += feedbackLines.length * 6 + 15;
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Descargar el PDF
  const fileName = `reporte_${reportData.studentName.replace(/\s+/g, '_')}_${reportData.evaluationTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Genera un reporte PDF básico con la información mínima disponible
 * @param studentName Nombre del estudiante
 * @param evaluationTitle Título de la evaluación
 * @param grade Calificación obtenida
 * @param date Fecha de la evaluación
 * @returns void (descarga el PDF automáticamente)
 */
export function generateBasicStudentReportPDF(
  studentName: string,
  evaluationTitle: string,
  grade: string,
  date: string
): void {
  const reportData: StudentReportData = {
    studentName,
    evaluationTitle,
    grade,
    date,
    submissionTime: new Date().toLocaleTimeString()
  };
  
  generateStudentReportPDF(reportData);
}