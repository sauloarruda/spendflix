import { classNames } from 'primereact/utils';

import { TransactionDto } from '@/actions/transactions';
import { currencyFormat, dateFormat, monthFormat } from 'utils/formatter';

interface CategoryTableProps {
  transactions: TransactionDto[];
}
export default function CategoryTable({ transactions }: CategoryTableProps) {
  // eslint-disable-next-line no-restricted-syntax
  let currentMonth: string;
  function itemTemplate(transaction: TransactionDto) {
    const renderMonth = currentMonth !== monthFormat.format(transaction.date);
    if (renderMonth) {
      currentMonth = monthFormat.format(transaction.date);
    }
    return (
      <>
        {renderMonth ? <div className="text-xl font-semibold mb-2 mt-6">{currentMonth}</div> : null}
        <div className="flex items-top mb-4 bg-white rounded-lg shadow p-4">
          <div className="w-8 h-8 border-1 border-gray-800 rounded flex items-center justify-center text-xl font-bold text-gray-800 shadow-sm bg-white mr-4">
            {dateFormat.format(transaction.date)}
          </div>
          <div className="flex-1">
            <div className="mb-1">
              <span
                className="inline-block rounded px-3 py-1 text-sm font-semibold text-white"
                style={{ backgroundColor: `var(--${transaction.color})` }}
              >
                {transaction.category}
              </span>
            </div>
            <div className="text-base text-blue-900">{transaction.description}</div>
            <div
              className={classNames([
                'mt-1 font-bold text-lg',
                transaction.amount >= 0 ? 'text-green-900' : 'text-red-900',
              ])}
            >
              {currencyFormat.format(transaction.amount)}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!transactions) return <></>;
  return <>{transactions.map((transaction) => itemTemplate(transaction))}</>;
}
