import { Card } from 'primereact/card';
import { classNames } from 'primereact/utils';

import BudgetCategoryChart from '@/components/reports/BudgetCategoryChart';
import { useTransactions } from '@/contexts/TransactionsContext';
import { currencyFormatter, monthFormatter, transactionAmountClass } from '@/utils/formatter';

export default function BudgetReport() {
  const transactions = useTransactions();

  if (!transactions) return <></>;

  const { groupedTransactions, categoryColors } = transactions.reduce(
    (acc, tx) => {
      acc.groupedTransactions[tx.categoryName] = acc.groupedTransactions[tx.categoryName] || {};
      const month = monthFormatter.format(new Date(tx.date));
      acc.groupedTransactions[tx.categoryName][month] =
        acc.groupedTransactions[tx.categoryName][month] || 0;
      acc.groupedTransactions[tx.categoryName][month] += tx.amount;
      acc.categoryColors[tx.categoryName] = tx.categoryColor;
      return acc;
    },
    {
      groupedTransactions: {} as Record<string, Record<string, number>>,
      categoryColors: {} as Record<string, string>,
    },
  );
  function displayTitle(categoryName: string, months: Record<string, number>) {
    const total = Object.values(months).reduce((sum: number, v: number) => sum + v, 0);
    return (
      <div className="flex items-center">
        <strong style={{ color: `var(--${categoryColors[categoryName]})` }}>{categoryName}</strong>
        <small className={classNames('ml-auto', transactionAmountClass(total))}>
          {currencyFormatter.format(total)}
        </small>
      </div>
    );
  }

  return (
    <>
      <div className="flex border-b-1 p-2 items-center mb-4">
        <h1 className="text-2xl flex-grow-1">Orçamento</h1>
      </div>
      {Object.entries(groupedTransactions)
        .sort((a, b) => {
          const totalA = Object.values(a[1]).reduce((sum, v) => sum + v, 0);
          const totalB = Object.values(b[1]).reduce((sum, v) => sum + v, 0);
          return totalA - totalB;
        })
        .map(([categoryName, months]) => (
          <Card className="my-2" title={displayTitle(categoryName, months)} key={categoryName}>
            <BudgetCategoryChart
              months={Object.entries(months).map(([month, amount]) => ({ month, amount }))}
              color={categoryColors[categoryName]}
            />
            {Object.entries(months).map(([month, amount]) => (
              <div key={month}>
                {month}: R$ {currencyFormatter.format(amount)}
              </div>
            ))}
          </Card>
        ))}
    </>
  );
}
