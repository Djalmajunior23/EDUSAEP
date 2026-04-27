export function DashboardKPIs({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Média Geral</p>
        <h3 className="text-2xl font-bold">{data.mediaGeral}</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Total Alunos</p>
        <h3 className="text-2xl font-bold">{data.totalAlunos}</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Taxa Conclusão</p>
        <h3 className="text-2xl font-bold">{data.taxaConclusao}%</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Alunos em Risco</p>
        <h3 className="text-2xl font-bold text-red-500">{data.alunosEmRisco}</h3>
      </div>
    </div>
  );
}
