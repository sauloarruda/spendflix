import { Chart as Chartjs } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'primereact/chart';
import tailwindColors from 'tailwindcss/colors';

interface BudgetCategoryChartProps {
  months: { month: string; amount: number }[];
  color: string;
}

Chartjs.register(ChartDataLabels);

const colors = tailwindColors as unknown as Record<string, Record<string, string>>;

function resolveTailwindColor(color: string): string {
  // Expects color like 'blue-500' or 'gray-800'
  const [base, level] = color.split('-');
  return colors[base]?.[level] || '#888';
}

export default function BudgetCategoryChart({ months, color }: BudgetCategoryChartProps) {
  const labels = months.map((m) => m.month);
  const data = months.map((m) => m.amount);
  const resolvedColor = resolveTailwindColor(color);

  const chartData = {
    labels,
    datasets: [
      {
        label: '',
        data,
        fill: false,
        borderColor: resolvedColor,
        backgroundColor: resolvedColor,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 16,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        font: {
          size: 10,
          weight: 'bold',
        },
        color: 'black',
        backgroundColor: '#DDD',
        anchor: 'end',
        align: 'top',
        padding: 3,
        borderRadius: 3,
        formatter: (value: number) => {
          if (typeof value !== 'number') {
            return '';
          }
          if (Math.abs(value) < 1000) {
            return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
          }
          return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}k`;
        },
        display: true,
      },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
        ticks: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
        ticks: { display: false },
      },
    },
    interaction: { intersect: false, mode: 'nearest' },
  };

  return (
    <div style={{ height: 56 }}>
      <Chart
        type="line"
        data={chartData}
        options={options}
        height="56px"
        plugins={[ChartDataLabels]}
      />
    </div>
  );
}
