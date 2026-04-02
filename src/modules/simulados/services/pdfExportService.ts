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
      
      // Header
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Desempenho Pedagógico', 15, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 33);

      // Student Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações do Aluno', 15, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${result.aluno || profile?.displayName || 'N/A'}`, 15, 62);
      doc.text(`E-mail: ${profile?.email || 'N/A'}`, 15, 67);
      if (profile?.matricula) doc.text(`Matrícula: ${profile.matricula}`, 15, 72);
      
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
      doc.text('Desempenho por Competência', 15, 90);
      
      const competenceData = (result.diagnostico_por_competencia || []).map((comp) => [
        comp.competencia || 'N/A',
        comp.total_questoes || 0,
        comp.acertos || 0,
        `${((comp.acuracia || 0) * 100).toFixed(1)}%`,
        comp.nivel || 'N/A'
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Competência', 'Questões', 'Acertos', '% Aproveitamento', 'Nível']],
        body: competenceData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });

      // Feedback Section
      let currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 150;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alertas e Observações', 15, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const alerts = result.summary?.alertas_dados && result.summary.alertas_dados.length > 0 
        ? result.summary.alertas_dados.join(', ') 
        : 'Nenhum alerta crítico identificado.';
      const splitAlerts = doc.splitTextToSize(alerts, pageWidth - 30);
      doc.text(splitAlerts, 15, currentY + 7);
      currentY += (splitAlerts.length * 5) + 15;

      // Recommendations
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações por Competência', 15, currentY);
      currentY += 10;

      (result.diagnostico_por_competencia || []).forEach((comp) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(comp.competencia || 'N/A', 15, currentY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitRec = doc.splitTextToSize(comp.recomendacoes || 'Sem recomendações.', pageWidth - 30);
        doc.text(splitRec, 15, currentY + 5);
        currentY += (splitRec.length * 4) + 10;
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
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Relatorio_Diagnostico_${(result.aluno || 'aluno').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      throw error;
    }
  },

  async exportElementToPDF(element: HTMLElement, filename: string) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#FFFFFF',
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach(svg => {
            if (!svg.getAttribute('xmlns')) {
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      if (imgData === 'data:,') {
        throw new Error('Canvas vazio. Falha ao renderizar o elemento.');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      throw error;
    }
  }
};
