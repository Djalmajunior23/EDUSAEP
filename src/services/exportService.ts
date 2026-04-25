import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export function exportStudentsToCSV(students: any[], filename: string = "export_alunos.csv") {
  const csv = Papa.unparse(students);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export async function exportDashboardToPDF(stats: any, disciplinePerformance: any[]) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Header
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246); // Indigo-ish color
  doc.text('Relatório Pedagógico S.A.E.P - V4', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${dateStr}`, 14, 28);
  
  // Resumo Geral
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('1. Resumo Executivo', 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Alunos', stats.totalStudents],
      ['Exames Realizados', stats.totalExams],
      ['Média Geral da Turma', `${(stats.averageScore * 100).toFixed(1)}%`],
      ['Taxa de Sucesso (Acima da Média)', `${(stats.successRate * 100).toFixed(1)}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] } // Indigo 600
  });

  // Desempenho por Disciplina
  doc.text('2. Desempenho por Disciplina', 14, (doc as any).lastAutoTable.finalY + 15);

  const disciplineBody = disciplinePerformance.map(d => [d.name, `${d.score}%`]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Unidade Curricular', 'Nota Média']],
    body: disciplineBody,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] } // Emerald 500
  });

  // Mapa de Vulnerabilidade (Error Engineering)
  if (stats.riskClusters && stats.riskClusters.length > 0) {
    doc.text('3. Radar de Vulnerabilidade (Clusters de Risco)', 14, (doc as any).lastAutoTable.finalY + 15);
    const riskBody = stats.riskClusters.map((r: any) => [
      r.description, 
      r.count, 
      (r.trend as string).toUpperCase()
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Descrição do Risco', 'Qtd de Alunos', 'Tendência']],
      body: riskBody,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] } // Red 500
    });
  }

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`EduAI Core ULTRA - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`Relatorio_SAEP_${dateStr.replace(/\//g, '-')}.pdf`);
}

export function exportStudentsToExcel(students: any[]) {
  const ws = XLSX.utils.json_to_sheet(students.map(s => ({
    'ID': s.id,
    'Nome': s.name,
    'E-mail': s.email,
    'XP': s.xp || 0,
    'Nível': Math.floor((s.xp || 0) / 1000) + 1,
    'Notificação Preferida': s.preferences?.notifications ? 'Sim' : 'Não'
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estudantes");

  XLSX.writeFile(wb, `Export_Alunos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
}
