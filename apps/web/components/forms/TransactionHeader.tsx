import { classNames } from 'primereact/utils';

import { TransactionDto } from '@/actions/transactions';
import { currencyFormatter, dateFormatter, transactionAmountClass } from '@/utils/formatter';

type TransactionHeaderProps = {
  transaction: TransactionDto;
};

export default function TransactionHeader({ transaction }: TransactionHeaderProps) {
  return (
    <div className="flex mb-2 items-end">
      <div className="grow grid grid-cols-1">
        <div className="text-blue-500 text-sm">{dateFormatter.format(transaction.date)}</div>
        <div>
          <span className="p-tag" style={{ backgroundColor: `var(--${transaction.accountColor})` }}>
            {transaction.accountName}
          </span>
        </div>
      </div>
      <strong
        className={classNames([
          'text-2xl font-semibold text-nowrap',
          transactionAmountClass(transaction.amount),
        ])}
      >
        {currencyFormatter.format(transaction.amount)}
      </strong>
    </div>
  );
}
