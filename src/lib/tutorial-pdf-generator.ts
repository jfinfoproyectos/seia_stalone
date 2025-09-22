import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { TutorialResult } from './gemini-tutorial-generator';

// Interface para extender jsPDF con autoTable
interface DocWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
  autoTable: (options: UserOptions) => void;
}

// Estilos para el PDF
interface PDFStyles {
  title: { fontSize: number; color: [number, number, number] };
  heading1: { fontSize: number; color: [number, number, number] };
  heading2: { fontSize: number; color: [number, number, number] };
  heading3: { fontSize: number; color: [number, number, number] };
  body: { fontSize: number; color: [number, number, number] };
  code: { fontSize: number; color: [number, number, number]; background: [number, number, number] };
  quote: { fontSize: number; color: [number, number, number]; background: [number, number, number] };
}

const defaultStyles: PDFStyles = {
  title: { fontSize: 20, color: [25, 25, 112] },
  heading1: { fontSize: 16, color: [52, 58, 64] },
  heading2: { fontSize: 14, color: [73, 80, 87] },
  heading3: { fontSize: 12, color: [108, 117, 125] },
  body: { fontSize: 10, color: [33, 37, 41] },
  code: { fontSize: 9, color: [220, 53, 69], background: [248, 249, 250] },
  quote: { fontSize: 10, color: [108, 117, 125], background: [233, 236, 239] }
};

// Función para agregar texto con salto de página automático
function addTextWithPageBreak(
  doc: DocWithAutoTable,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 6,
  margins: { top: number; bottom: number }
): number {
  if (!text || text.trim() === '') {
    return y;
  }
  
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  
  for (const line of lines) {
    // Verificar si necesitamos una nueva página con más margen
    if (currentY + lineHeight > doc.internal.pageSize.height - margins.bottom) {
      doc.addPage();
      currentY = margins.top;
    }
    
    // Asegurar que la línea no esté vacía antes de renderizar
    if (typeof line === 'string' && line.trim() !== '') {
      doc.text(line, x, currentY);
    }
    currentY += lineHeight;
  }
  
  return currentY;
}

// Función para procesar texto con formato markdown inline
function processInlineMarkdown(text: string): { text: string; formats: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'code' | 'link'; url?: string }> } {
  const formats: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'code' | 'link'; url?: string }> = [];
  let processedText = text;
  let offset = 0;

  // Procesar enlaces [texto](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    const start = linkMatch.index - offset;
    const linkText = linkMatch[1];
    const url = linkMatch[2];
    formats.push({ start, end: start + linkText.length, type: 'link', url });
    processedText = processedText.replace(linkMatch[0], linkText);
    offset += linkMatch[0].length - linkText.length;
  }

  // Procesar código inline `código`
  const codeRegex = /`([^`]+)`/g;
  let codeMatch;
  while ((codeMatch = codeRegex.exec(processedText)) !== null) {
    const start = codeMatch.index;
    const codeText = codeMatch[1];
    formats.push({ start, end: start + codeText.length, type: 'code' });
    processedText = processedText.replace(codeMatch[0], codeText);
  }

  // Procesar texto en negrita **texto**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(processedText)) !== null) {
    const start = boldMatch.index;
    const boldText = boldMatch[1];
    formats.push({ start, end: start + boldText.length, type: 'bold' });
    processedText = processedText.replace(boldMatch[0], boldText);
  }

  // Procesar texto en cursiva *texto*
  const italicRegex = /\*([^*]+)\*/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(processedText)) !== null) {
    const start = italicMatch.index;
    const italicText = italicMatch[1];
    formats.push({ start, end: start + italicText.length, type: 'italic' });
    processedText = processedText.replace(italicMatch[0], italicText);
  }

  return { text: processedText, formats };
}

// Función para renderizar texto con formato
function renderFormattedText(
  doc: DocWithAutoTable,
  text: string,
  formats: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'code' | 'link'; url?: string }>,
  x: number,
  y: number,
  maxWidth: number,
  styles: PDFStyles
): number {
  if (!text || text.trim() === '') return y;

  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  
  for (const line of lines) {
     let currentX = x;
     
     for (let i = 0; i < line.length; i++) {
       const char = line[i];
       const globalIndex = text.indexOf(line) + i;
      
      // Verificar si este carácter tiene formato
      const format = formats.find(f => globalIndex >= f.start && globalIndex < f.end);
      
      if (format) {
        switch (format.type) {
          case 'bold':
            doc.setFont('helvetica', 'bold');
            break;
          case 'italic':
            doc.setFont('helvetica', 'italic');
            break;
          case 'code':
            doc.setFont('courier', 'normal');
            doc.setTextColor(...styles.code.color);
            break;
          case 'link':
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 255); // Azul para enlaces
            break;
          default:
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...styles.body.color);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...styles.body.color);
      }
      
      doc.text(char, currentX, currentY);
      currentX += doc.getTextWidth(char);
    }
    
    currentY += 6;
  }
  
  return currentY;
}

// Función para procesar contenido markdown y convertirlo a PDF
function processMarkdownContent(
  doc: DocWithAutoTable,
  content: string,
  x: number,
  startY: number,
  maxWidth: number,
  styles: PDFStyles,
  margins: { top: number; bottom: number }
): number {
  if (!content || content.trim() === '') {
    return startY;
  }
  
  const lines = content.split('\n');
  let currentY = startY;
  let inCodeBlock = false;
  let codeBlockContent = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar si necesitamos una nueva página con más margen de seguridad
    if (currentY > doc.internal.pageSize.height - margins.bottom - 50) {
      doc.addPage();
      currentY = margins.top;
    }
    
    const trimmedLine = line.trim();
    
    // Manejar bloques de código
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // Fin del bloque de código
        if (codeBlockContent.trim()) {
          doc.setFontSize(styles.code.fontSize);
          doc.setTextColor(...styles.code.color);
          doc.setFont('courier', 'normal');
          // Agregar fondo gris claro
          doc.setFillColor(...styles.code.background);
          const codeLines = doc.splitTextToSize(codeBlockContent, maxWidth - 20);
          const codeHeight = codeLines.length * 6 + 10;
          doc.rect(x - 3, currentY - 5, maxWidth + 6, codeHeight, 'F');
          currentY = addTextWithPageBreak(doc, codeBlockContent, x + 5, currentY, maxWidth - 20, 6, margins);
          currentY += 8;
        }
        inCodeBlock = false;
        codeBlockContent = '';
      } else {
        // Inicio del bloque de código
        inCodeBlock = true;
        currentY += 5;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Manejar tablas
    if (trimmedLine.includes('|') && !inTable) {
      inTable = true;
      tableHeaders = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      continue;
    }
    
    if (inTable && trimmedLine.includes('|')) {
      if (trimmedLine.includes('---') || trimmedLine.includes('===')) {
        // Línea separadora de tabla, ignorar
        continue;
      }
      
      const row = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      if (row.length > 0) {
        tableRows.push(row);
      }
      continue;
    }
    
    if (inTable && (!trimmedLine.includes('|') || trimmedLine === '')) {
      // Fin de tabla
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        doc.autoTable({
          head: [tableHeaders],
          body: tableRows,
          startY: currentY,
          margin: { left: x },
          styles: { fontSize: styles.body.fontSize },
          headStyles: { fillColor: [52, 58, 64], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 249, 250] }
        });
        currentY = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;
      }
      inTable = false;
      tableRows = [];
      tableHeaders = [];
    }
    
    if (inTable) continue;
    
    // Manejar encabezados
    if (trimmedLine.startsWith('### ')) {
      currentY += 8;
      doc.setFontSize(styles.heading3.fontSize);
      doc.setTextColor(...styles.heading3.color);
      doc.setFont('helvetica', 'bold');
      const { text, formats } = processInlineMarkdown(trimmedLine.substring(4));
      currentY = renderFormattedText(doc, text, formats, x, currentY, maxWidth, styles);
      currentY += 5;
    } else if (trimmedLine.startsWith('## ')) {
      currentY += 10;
      doc.setFontSize(styles.heading2.fontSize);
      doc.setTextColor(...styles.heading2.color);
      doc.setFont('helvetica', 'bold');
      const { text, formats } = processInlineMarkdown(trimmedLine.substring(3));
      currentY = renderFormattedText(doc, text, formats, x, currentY, maxWidth, styles);
      currentY += 6;
    } else if (trimmedLine.startsWith('# ')) {
      currentY += 12;
      doc.setFontSize(styles.heading1.fontSize);
      doc.setTextColor(...styles.heading1.color);
      doc.setFont('helvetica', 'bold');
      const { text, formats } = processInlineMarkdown(trimmedLine.substring(2));
      currentY = renderFormattedText(doc, text, formats, x, currentY, maxWidth, styles);
      currentY += 8;
    } else if (trimmedLine.startsWith('> ')) {
      // Quote
      doc.setFontSize(styles.quote.fontSize);
      doc.setTextColor(...styles.quote.color);
      doc.setFont('helvetica', 'italic');
      const quoteText = trimmedLine.substring(2);
      const { text, formats } = processInlineMarkdown(quoteText);
      const quoteLines = doc.splitTextToSize(text, maxWidth - 30);
      const quoteHeight = quoteLines.length * 6 + 8;
      doc.setFillColor(...styles.quote.background);
      doc.rect(x - 3, currentY - 2, maxWidth + 6, quoteHeight, 'F');
      currentY = renderFormattedText(doc, text, formats, x + 15, currentY + 4, maxWidth - 30, styles);
      currentY += 6;
    } else if (trimmedLine.match(/^\d+\. /)) {
      // Lista numerada
      doc.setFontSize(styles.body.fontSize);
      doc.setTextColor(...styles.body.color);
      doc.setFont('helvetica', 'normal');
      const { text, formats } = processInlineMarkdown(trimmedLine);
      currentY = renderFormattedText(doc, text, formats, x + 10, currentY + 4, maxWidth - 20, styles);
      currentY += 3;
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Lista con viñetas
      doc.setFontSize(styles.body.fontSize);
      doc.setTextColor(...styles.body.color);
      doc.setFont('helvetica', 'normal');
      const { text, formats } = processInlineMarkdown('• ' + trimmedLine.substring(2));
      currentY = renderFormattedText(doc, text, formats, x + 10, currentY + 4, maxWidth - 20, styles);
      currentY += 3;
    } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***')) {
      // Línea horizontal
      currentY += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(x, currentY, x + maxWidth, currentY);
      currentY += 5;
    } else if (trimmedLine.length > 0) {
      // Párrafo regular
      doc.setFontSize(styles.body.fontSize);
      doc.setTextColor(...styles.body.color);
      doc.setFont('helvetica', 'normal');
      const { text, formats } = processInlineMarkdown(trimmedLine);
      currentY = renderFormattedText(doc, text, formats, x, currentY + 4, maxWidth, styles);
      currentY += 4;
    } else {
      // Línea vacía
      currentY += 6;
    }
  }
  
  return currentY;
}

// Función para agregar tabla de contenidos
function addTableOfContents(
  doc: DocWithAutoTable,
  tutorial: TutorialResult,
  x: number,
  startY: number,
  styles: PDFStyles
): number {
  doc.setFontSize(styles.heading1.fontSize);
  doc.setTextColor(...styles.heading1.color);
  doc.setFont('helvetica', 'bold');
  doc.text('Tabla de Contenidos', x, startY);
  
  let currentY = startY + 20;
  
  if (tutorial.sections && tutorial.sections.length > 0) {
    tutorial.sections.forEach((section, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 30;
      }
      
      doc.setFontSize(styles.body.fontSize + 1);
      doc.setTextColor(...styles.body.color);
      doc.setFont('helvetica', 'normal');
      
      const sectionTitle = `${index + 1}. ${section.title || 'Sin título'}`;
      doc.text(sectionTitle, x + 10, currentY);
      currentY += 10;
      
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection, subIndex) => {
          if (currentY > doc.internal.pageSize.height - 50) {
            doc.addPage();
            currentY = 30;
          }
          
          doc.setFontSize(styles.body.fontSize);
          const subsectionTitle = `   ${index + 1}.${subIndex + 1}. ${subsection.title || 'Sin título'}`;
          doc.text(subsectionTitle, x + 20, currentY);
          currentY += 8;
        });
      }
      
      currentY += 5; // Espacio adicional entre secciones
    });
  }
  
  return currentY + 10;
}

// Función principal para generar PDF del tutorial
export function generateTutorialPdf(
  tutorial: TutorialResult,
  options: {
    includeMetadata?: boolean;
    includeTableOfContents?: boolean;
    customStyles?: Partial<PDFStyles>;
    pageFormat?: 'a4' | 'letter' | 'legal';
    margins?: { top: number; right: number; bottom: number; left: number };
  } = {}
): DocWithAutoTable {
  const {
    includeMetadata = true,
    includeTableOfContents = true,
    customStyles = {},
    pageFormat = 'a4',
    margins = { top: 20, right: 20, bottom: 20, left: 20 }
  } = options;
  
  const styles = { ...defaultStyles, ...customStyles };
  
  // Configurar formato de página
  let pdfFormat: string;
  switch (pageFormat) {
    case 'letter':
      pdfFormat = 'letter';
      break;
    case 'legal':
      pdfFormat = 'legal';
      break;
    default:
      pdfFormat = 'a4';
  }
  
  const doc = new jsPDF({ format: pdfFormat }) as DocWithAutoTable;
  
  // Inicializar el plugin autoTable
  doc.autoTable = (options: UserOptions) => autoTable(doc, options);
  doc.lastAutoTable = { finalY: 0 };
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - margins.left - margins.right;
  
  let y = margins.top + 30;
  
  // Portada profesional
  // Línea decorativa superior
  doc.setDrawColor(25, 25, 112);
  doc.setLineWidth(2);
  doc.line(margins.left, y - 10, pageWidth - margins.right, y - 10);
  
  // Título principal con manejo de texto largo
  doc.setFontSize(styles.title.fontSize);
  doc.setTextColor(...styles.title.color);
  doc.setFont('helvetica', 'bold');
  
  // Dividir el título en líneas si es muy largo
  const titleLines = doc.splitTextToSize(tutorial.title, contentWidth - 40);
  const titleStartY = y + 10;
  
  titleLines.forEach((line: string, index: number) => {
    doc.text(line, pageWidth / 2, titleStartY + (index * 8), { align: 'center' });
  });
  
  y = titleStartY + (titleLines.length * 8) + 15;
  
  // Línea decorativa inferior
  doc.setDrawColor(25, 25, 112);
  doc.setLineWidth(1);
  doc.line(margins.left + 50, y, pageWidth - margins.right - 50, y);
  y += 20;
  
  // Descripción con mejor formato
  if (tutorial.description) {
    doc.setFontSize(styles.body.fontSize + 2);
    doc.setTextColor(73, 80, 87);
    doc.setFont('helvetica', 'italic');
    
    // Crear un marco para la descripción
    const descStartY = y;
    y = addTextWithPageBreak(doc, tutorial.description, margins.left + 20, y + 10, contentWidth - 40, 7, margins);
    
    // Marco decorativo alrededor de la descripción
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margins.left + 10, descStartY, contentWidth - 20, y - descStartY + 5);
    
    y += 20;
  }
  
  // Metadatos con diseño mejorado
  if (includeMetadata && tutorial.metadata) {
    doc.setFontSize(styles.heading2.fontSize + 2);
    doc.setTextColor(25, 25, 112);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 Información del Tutorial', margins.left, y);
    y += 15;
    
    const metadataData = [
      ['⏱️ Tiempo estimado de lectura', tutorial.metadata.estimatedReadTime],
      ['📊 Dificultad', tutorial.metadata.difficulty],
      ['📚 Prerrequisitos', tutorial.metadata.prerequisites.join(', ') || 'Ninguno'],
      ['🎯 Objetivos de aprendizaje', tutorial.metadata.learningObjectives.join(', ') || 'No especificados']
    ];
    
    doc.autoTable({
      startY: y,
      head: [['Propiedad', 'Valor']],
      body: metadataData,
      theme: 'striped',
      headStyles: { 
        fillColor: [25, 25, 112], 
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 8
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margins.left, right: margins.right }
    });
    
    y = doc.lastAutoTable.finalY + 25;
  }
  
  // Tabla de contenidos
  if (includeTableOfContents) {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = margins.top;
    }
    y = addTableOfContents(doc, tutorial, margins.left, y, styles);
    doc.addPage();
    y = margins.top;
  }
  
  // Contenido de las secciones con mejor diseño
  tutorial.sections.forEach((section, index) => {
    // Verificar si necesitamos nueva página para la sección
    if (y > pageHeight - 80) {
      doc.addPage();
      y = margins.top;
    }
    
    // Título de sección con fondo y numeración mejorada
    
    // Fondo para el título de sección
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(25, 25, 112);
    doc.setLineWidth(0.5);
    doc.rect(margins.left, y - 5, contentWidth, 18, 'FD');
    
    doc.setFontSize(styles.heading1.fontSize + 1);
    doc.setTextColor(25, 25, 112);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${section.title}`, margins.left + 10, y + 8);
    y += 25;
    
    // Contenido de la sección
    y = processMarkdownContent(doc, section.content, margins.left, y, contentWidth, styles, margins);
    y += 10;
    
    // Ejemplos con diseño mejorado
    if (section.examples && section.examples.length > 0) {
      doc.setFontSize(styles.heading3.fontSize + 1);
      doc.setTextColor(34, 139, 34);
      doc.setFont('helvetica', 'bold');
      doc.text('💡 Ejemplos:', margins.left, y);
      y += 12;
      
      section.examples.forEach((example, exampleIndex) => {
        // Fondo sutil para ejemplos
        const exampleStartY = y - 3;
        doc.setFillColor(248, 255, 248);
        doc.setDrawColor(34, 139, 34);
        doc.setLineWidth(0.3);
        
        doc.setFontSize(styles.body.fontSize);
        doc.setTextColor(...styles.body.color);
        doc.setFont('helvetica', 'normal');
        
        const exampleText = `${exampleIndex + 1}. ${example}`;
        const exampleLines = doc.splitTextToSize(exampleText, contentWidth - 30);
        const exampleHeight = exampleLines.length * 6 + 6;
        
        doc.rect(margins.left + 5, exampleStartY, contentWidth - 10, exampleHeight, 'FD');
        y = addTextWithPageBreak(doc, exampleText, margins.left + 15, y, contentWidth - 30, 6, margins);
        y += 8;
      });
      y += 10;
    }
    
    // Ejercicios con diseño mejorado
    if (section.exercises && section.exercises.length > 0) {
      doc.setFontSize(styles.heading3.fontSize + 1);
      doc.setTextColor(255, 140, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('🏋️ Ejercicios:', margins.left, y);
      y += 12;
      
      section.exercises.forEach((exercise, exerciseIndex) => {
        // Fondo sutil para ejercicios
        const exerciseStartY = y - 3;
        doc.setFillColor(255, 248, 240);
        doc.setDrawColor(255, 140, 0);
        doc.setLineWidth(0.3);
        
        doc.setFontSize(styles.body.fontSize);
        doc.setTextColor(...styles.body.color);
        doc.setFont('helvetica', 'normal');
        
        const exerciseText = `${exerciseIndex + 1}. ${exercise}`;
        const exerciseLines = doc.splitTextToSize(exerciseText, contentWidth - 30);
        const exerciseHeight = exerciseLines.length * 6 + 6;
        
        doc.rect(margins.left + 5, exerciseStartY, contentWidth - 10, exerciseHeight, 'FD');
        y = addTextWithPageBreak(doc, exerciseText, margins.left + 15, y, contentWidth - 30, 6, margins);
        y += 8;
      });
      y += 10;
    }
    
    // Recursos con diseño mejorado
    if (section.resources && section.resources.length > 0) {
      doc.setFontSize(styles.heading3.fontSize + 1);
      doc.setTextColor(138, 43, 226);
      doc.setFont('helvetica', 'bold');
      doc.text('📖 Recursos adicionales:', margins.left, y);
      y += 12;
      
      section.resources.forEach((resource) => {
        // Fondo sutil para recursos
        const resourceStartY = y - 3;
        doc.setFillColor(248, 248, 255);
        doc.setDrawColor(138, 43, 226);
        doc.setLineWidth(0.3);
        
        doc.setFontSize(styles.body.fontSize);
        doc.setTextColor(...styles.body.color);
        doc.setFont('helvetica', 'normal');
        
        const resourceText = `• ${resource}`;
        const resourceLines = doc.splitTextToSize(resourceText, contentWidth - 30);
        const resourceHeight = resourceLines.length * 6 + 6;
        
        doc.rect(margins.left + 5, resourceStartY, contentWidth - 10, resourceHeight, 'FD');
        y = addTextWithPageBreak(doc, resourceText, margins.left + 15, y, contentWidth - 30, 6, margins);
        y += 8;
      });
      y += 10;
    }
    
    // Subsecciones
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach((subsection, subIndex) => {
        doc.setFontSize(styles.heading2.fontSize);
        doc.setTextColor(...styles.heading2.color);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}.${subIndex + 1}. ${subsection.title}`, margins.left + 10, y);
        y += 12;
        
        y = processMarkdownContent(doc, subsection.content, margins.left + 10, y, contentWidth - 10, styles, margins);
        y += 8;
      });
    }
    
    y += 15;
  });
  
  // Agregar números de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

// Función de conveniencia para descargar directamente
export function downloadTutorialPdf(
  tutorial: TutorialResult,
  filename?: string,
  options?: Parameters<typeof generateTutorialPdf>[1]
): void {
  const doc = generateTutorialPdf(tutorial, options);
  const finalFilename = filename || `${tutorial.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  doc.save(finalFilename);
}