import { TooltipItem } from 'chart.js';
import { Chart } from 'primereact/chart';
import { useEffect, useState } from 'react';
import colors from 'tailwindcss/colors';

import { TransactionDto } from '@/actions/transactions';
import { currencyFormat, monthFormat } from 'utils/formatter';

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

    transactions.forEach((tx) => {
      const month = monthFormat.format(tx.date);
      monthsSet.add(month);
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

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const data = {
      labels: months,
      datasets,
    };
    const options = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 1 / Object.keys(categoriesColors).length,
      plugins: {
        legend: {
          labels: {
            fontColor: textColor,
          },
        },
        tooltip: {
          callbacks: {
            label(context: TooltipItem<'bar'>) {
              // context.dataset.label is the category name
              // context.parsed.x is the value for horizontal bar charts
              const category = context.dataset.label;
              const value = context.parsed.x;
              return `${category}: ${currencyFormat.format(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500,
            },
            callback: (value: number) => currencyFormat.format(value),
          },
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
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
