import { classNames } from 'primereact/utils';

import {
  useResultsReport,
  defaultCategoryMapping,
  type ResultsReportRow,
} from '@/contexts/ResultsReportContext';
import { currencyFormatter, transactionAmountClass } from 'utils/formatter';

export default function ResultsTable() {
  const context = useResultsReport();
  const rows: ResultsReportRow[] = context?.rows ?? [];
  const categoryMapping = context?.categoryMapping ?? defaultCategoryMapping;
  const categories = Object.keys(categoryMapping) as (keyof typeof defaultCategoryMapping)[];

  if (!rows.length) return null;

  // Extract months and categories
  const months: string[] = rows.map((row) => row.month);

  return (
    <div className="w-full overflow-x-auto my-8">
      <table className="text-sm min-w-full table-auto md:table-fixed">
        <thead>
          <tr className="bg-gray-200 border-b-1 border-b-gray-300">
            <th></th>
            {months.map((month) => (
              <th className="px-1 py-2" key={month}>
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((key) => {
            const cat = categoryMapping[key];
            if (!cat) return null;
            return (
              <tr key={String(key)}>
                <th className="text-left" style={{ color: `var(${cat.color || '--gray-800'})` }}>
                  {cat.name}
                </th>
                {rows.map((row) => (
                  <td
                    className={classNames([
                      'px-1 py-2 text-nowrap text-center',
                      transactionAmountClass(row[key]),
                    ])}
                    key={row.month}
                  >
                    {currencyFormatter.format(row[key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
