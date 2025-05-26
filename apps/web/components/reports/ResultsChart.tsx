import { TooltipItem } from 'chart.js';
import { Chart } from 'primereact/chart';

import {
  useResultsReport,
  defaultCategoryMapping,
  ResultsReportRow,
} from '@/contexts/ResultsReportContext';
import { currencyFormatter } from '@/utils/formatter';

export default function ResultsChart() {
  const context = useResultsReport();
  const rows: ResultsReportRow[] = context?.rows ?? [];
  const categoryMapping = context?.categoryMapping ?? defaultCategoryMapping;
  const categories = Object.keys(categoryMapping) as (keyof typeof defaultCategoryMapping)[];

  const documentStyle =
    typeof window !== 'undefined' ?
      getComputedStyle(document.documentElement) :
      { getPropertyValue: () => '' };

  const labels = rows.map((row) => row.month);

  const datasets = categories
    .map((cat) => {
      const catInfo = categoryMapping[cat];
      if (!catInfo) return null;
      return {
        label: catInfo.name,
        data: rows.map((row) => row[cat]),
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
          label(ttContext: TooltipItem<'line'>) {
            const category = ttContext.dataset.label;
            const value = ttContext.parsed.y;
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
