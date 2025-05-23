import { classNames } from 'primereact/utils';

import { useResultsReport } from '@/contexts/ResultsReportContext';
import { currencyFormatter, transactionAmountClass } from 'utils/formatter';

export default function ResultsTable() {
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

  if (!rows.length) return null;

  // Extract months and categories
  const months = rows.map((row) => row.month);

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
              <tr key={key}>
                <th className="text-left" style={{ color: `var(${cat.color || '--gray-800'})` }}>
                  {cat.name}
                </th>
                {rows.map((row) => (
                  <td
                    className={classNames([
                      'px-1 py-2 text-nowrap text-center',
                      transactionAmountClass(row[key as keyof typeof row] as number),
                    ])}
                    key={row.month}
                  >
                    {currencyFormatter.format(row[key as keyof typeof row] as number)}
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
