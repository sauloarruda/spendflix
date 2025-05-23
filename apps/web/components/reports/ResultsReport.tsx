'use client';

import ResultsChart from './ResultsChart';
import ResultsTable from './ResultsTable';

export default function ResultsReport() {
  return (
    <>
      <div className="flex border-b-1 p-2 items-center mb-4">
        <h1 className="text-2xl flex-grow-1">Resultados</h1>
      </div>
      <ResultsChart />
      <ResultsTable />
    </>
  );
}
