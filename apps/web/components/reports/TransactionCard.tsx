import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import { TransactionDto } from '@/actions/transactions';
import { currencyFormatter, dayFormatter, transactionAmountClass } from '@/utils/formatter';

type CategoryCardProps = {
  transaction: TransactionDto;
  onEdit: (transaction: TransactionDto) => void;
};
export default function TransactionCard({ transaction, onEdit }: CategoryCardProps) {
  return (
    <div className="flex items-top mb-4 bg-white rounded-lg shadow p-4" key={transaction.id}>
      <div className="w-16 h-24">
        <div className="mb-4 border-1 border-gray-800 rounded flex items-center justify-center text-xl font-bold text-gray-800 shadow-sm bg-white mr-4">
          {dayFormatter.format(transaction.date)}
        </div>
        <Button
          icon="pi pi-pencil"
          rounded
          size="small"
          onClick={() => onEdit(transaction)}
        ></Button>
      </div>
      <div className="flex-1">
        <div className="mb-1">
          <span
            className="inline-block rounded px-3 py-1 text-sm font-semibold text-white mb-2 mr-2"
            style={{ backgroundColor: `var(--${transaction.categoryColor})` }}
          >
            {transaction.categoryName}
          </span>
          {transaction.notes && (
            <div className="flex rounded px-3 py-1 text-sm bg-gray-100">
              <i className="pi pi-book"></i>
              <span className="ml-2 text-ellipsis md:text-clip">{transaction.notes}</span>
            </div>
          )}
        </div>
        <div className="text-base text-blue-900">{transaction.description}</div>
        <div
          className={classNames([
            'mt-1 font-bold text-lg',
            transactionAmountClass(transaction.amount),
          ])}
        >
          {currencyFormatter.format(transaction.amount)}
        </div>
      </div>
    </div>
  );
}
