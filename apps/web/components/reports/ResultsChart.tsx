import { TooltipItem } from 'chart.js';
import { Chart } from 'primereact/chart';

import { useResultsReport } from '@/contexts/ResultsReportContext';

import { currencyFormatter } from '../../utils/formatter';

export default function ResultsChart() {
  const defaultCategoryMapping = {
    revenue: { name: 'Receitas', color: '--green-800' },
    expenses: { name: 'Despesas', color: '--red-800' },
    investment: { name: 'Investimento', color: '--gray-800' },
    result: { name: 'Resultado', color: '--orange-400' },
  };
  const { rows, categoryMapping } = useResultsReport() ?? {
    rows: [],
    categoryMapping: defaultCategoryMapping,
  };
  const categories = Object.keys(categoryMapping) as (keyof typeof defaultCategoryMapping)[];

  const documentStyle =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
      : { getPropertyValue: () => '' };

  const labels = rows.map((row) => row.month);

  const datasets = categories
    .map((cat) => {
      const catInfo = categoryMapping[cat];
      if (!catInfo) return null;
      return {
        label: catInfo.name,
        data: rows.map((row) => row[cat as keyof typeof row] as number),
        fill: false,
        borderColor: documentStyle.getPropertyValue(catInfo.color || '--gray-800'),
        backgroundColor: documentStyle.getPropertyValue(catInfo.color || '--gray-800'),
        tension: 0.4,
      };
    })
    .filter(Boolean);

  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

  const options = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<'line'>) {
            const category = context.dataset.label;
            const value = context.parsed.y;
            return `${category}: ${currencyFormatter.format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  };

  return <Chart type="line" data={{ labels, datasets }} options={options} />;
}
