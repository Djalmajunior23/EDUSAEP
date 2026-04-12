import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { DiagnosticResult } from '../../../services/geminiService';
import { UserProfile } from '../../../App';

export const pdfExportService = {
  async exportDiagnosticReport(result: DiagnosticResult, profile: UserProfile | null) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      const checkPageBreak = (currentY: number, neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - 20) {
          doc.addPage();
          return 20;
        }
        return currentY;
      };

      // Header
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Desempenho Pedagógico', margin, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 33);

      // Student Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações do Aluno', margin, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${result.aluno || profile?.displayName || 'N/A'}`, margin, 62);
      doc.text(`E-mail: ${profile?.email || 'N/A'}`, margin, 67);
      if (profile?.matricula) doc.text(`Matrícula: ${profile.matricula}`, margin, 72);
      
      // Exam Info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo do Desempenho', 110, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pontuação: ${result.summary?.acertos || 0} / ${result.summary?.total_questoes || 0}`, 110, 62);
      
      const percentage = ((result.summary?.acuracia_geral || 0) * 100).toFixed(1);
      doc.setFont('helvetica', 'bold');
      doc.text(`Aproveitamento Geral: ${percentage}%`, 110, 67);
      doc.text(`Aproveitamento Ponderado: ${((result.summary?.acuracia_ponderada || 0) * 100).toFixed(1)}%`, 110, 72);

      // Competencies Table
      doc.setFontSize(14);
      doc.text('Desempenho por Competência', margin, 90);
      
      const competencies = result.diagnostico_por_competencia || [];
      const competenceData = competencies.map((comp) => [
        comp.competencia || 'N/A',
        comp.total_questoes || 0,
        comp.acertos || 0,
        `${((comp.acuracia_ponderada || comp.acuracia || 0) * 100).toFixed(1)}%`,
        comp.nivel || 'N/A'
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Competência', 'Questões', 'Acertos', '% Aproveitamento', 'Nível']],
        body: competenceData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 255, 250] },
        margin: { left: margin, right: margin }
      });

      // Feedback Section
      let currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 150;
      
      currentY = checkPageBreak(currentY, 15);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alertas e Observações', margin, currentY);
      currentY += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const alerts = result.summary?.alertas_dados && result.summary.alertas_dados.length > 0 
        ? result.summary.alertas_dados.join(', ') 
        : 'Nenhum alerta crítico identificado.';
      const splitAlerts = doc.splitTextToSize(alerts, contentWidth);
      
      splitAlerts.forEach((line: string) => {
        currentY = checkPageBreak(currentY, 7);
        doc.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 10;

      // Recommendations
      currentY = checkPageBreak(currentY, 15);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações por Competência', margin, currentY);
      currentY += 10;

      (result.diagnostico_por_competencia || []).forEach((comp) => {
        const splitRec = doc.splitTextToSize(comp.recomendacoes || 'Sem recomendações.', contentWidth);
        
        currentY = checkPageBreak(currentY, 10);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(comp.competencia || 'N/A', margin, currentY);
        currentY += 5;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        splitRec.forEach((line: string) => {
          currentY = checkPageBreak(currentY, 6);
          doc.text(line, margin, currentY);
          currentY += 4;
        });
        currentY += 6;
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado pelo Sistema de Diagnóstico Pedagógico`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`Relatorio_Diagnostico_${(result.aluno || 'aluno').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar relatório PDF:', error);
      throw error;
    }
  },

  async exportElementToPDF(element: HTMLElement, filename: string) {
    try {
      // Ensure element is visible and has dimensions
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Try to wait a bit if it's a rendering issue
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Store original scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Scroll to top to ensure html2canvas captures correctly
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc, clonedElement) => {
          // Fix for SVGs in html2canvas
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach(svg => {
            const svgRect = svg.getBoundingClientRect();
            if (svgRect.width > 0 && svgRect.height > 0) {
              svg.setAttribute('width', svgRect.width.toString());
              svg.setAttribute('height', svgRect.height.toString());
            }
            if (!svg.getAttribute('xmlns')) {
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
          });

          // Ensure cloned element is visible and has correct layout for capture
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.width = `${element.offsetWidth}px`;
            clonedElement.style.position = 'relative';
            clonedElement.style.display = 'block';
            
            // Remove any sticky or fixed positioning that might break capture
            const stickyElements = clonedElement.querySelectorAll('*');
            stickyElements.forEach(el => {
              if (el instanceof HTMLElement) {
                const style = window.getComputedStyle(el);
                if (style.position === 'sticky' || style.position === 'fixed') {
                  el.style.position = 'relative';
                }
              }
            });
          }
        }
      });
      
      // Restore scroll position
      window.scrollTo(scrollX, scrollY);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (!imgData || imgData === 'data:,') {
        throw new Error('Falha ao capturar imagem do elemento. O canvas está vazio.');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Erro no PDF Export Service:', error);
      throw error;
    }
  }
};
