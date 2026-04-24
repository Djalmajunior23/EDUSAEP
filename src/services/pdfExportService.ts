import { jsPDF } from 'jspdf';
import { toCanvas } from 'html-to-image';

export const pdfExportService = {
  /**
   * Generates a PDF from a DOM element.
   * Useful for exporting study plans, diagnostics, and reports.
   */
  async exportElementToPDF(element: HTMLElement | null, filename: string = 'documento.pdf') {
    if (!element) return;

    try {
      const canvas = await toCanvas(element, {
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0',
          boxShadow: 'none'
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
};
