import { TooltipItem, Chart as Chartjs } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'primereact/chart';
import { useEffect, useState } from 'react';
import colors from 'tailwindcss/colors';

import { TransactionDto } from '@/actions/transactions';
import { currencyFormat, monthFormat } from 'utils/formatter';

Chartjs.register(ChartDataLabels);

interface CategoryBarCharProps {
  transactions: TransactionDto[];
}

export default function CategoryBarChar({ transactions }: CategoryBarCharProps) {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const monthsSet = new Set<string>();
    const categoriesColors: Record<string, string> = {};
    const grouped: Record<string, Record<string, number>> = {};
    let total = 0;

    transactions.forEach((tx) => {
      const month = monthFormat.format(tx.date);
      monthsSet.add(month);
      total += tx.amount;
      categoriesColors[tx.category] = tx.color;
      if (!grouped[tx.category]) grouped[tx.category] = {};
      grouped[tx.category][month] = (grouped[tx.category][month] || 0) + tx.amount;
    });

    const months = Array.from(monthsSet);

    const datasets = Object.keys(grouped).map((category) => {
      const [color, level] = categoriesColors[category].split('-');
      return {
        label: category,
        data: months.map((month) => grouped[category][month] || 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backgroundColor: (colors as any)[color]?.[level],
      };
    });

    const data = {
      labels: months,
      datasets,
    };

    const defaultRatio = 3.5;
    const options = {
      responsive: true,
      aspectRatio:
        Object.keys(categoriesColors).length === 1
          ? 2
          : defaultRatio / Object.keys(categoriesColors).length,
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: {
            label(context: TooltipItem<'bar'>) {
              const category = context.dataset.label;
              const value = context.parsed.x;
              return `${category}: ${currencyFormat.format(value)}`;
            },
          },
        },
        datalabels: {
          font: {
            size: 12,
            weight: 'bold',
          },
          color: 'black', // Example: Label color
          backgroundColor: '#DDD',
          anchor: 'center', // Example: Label position
          padding: 5,
          formatter: (value: number) => {
            const percentage = `${((value / total) * 100).toFixed(0)}%`;
            return percentage;
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: (value: number) => currencyFormat.format(value),
          },
        },
      },
    };

    setChartData(data);
    setChartOptions(options);
  }, [transactions]);

  return (
    <div className="card">
      <Chart type="bar" data={chartData} options={chartOptions} />
    </div>
  );
}
