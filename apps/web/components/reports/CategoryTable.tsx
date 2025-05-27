import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import TransactionForm from '@/components/forms/TransactionForm';
import TransactionCard from '@/components/reports/TransactionCard';
import { currencyFormatter, monthFormatter, transactionAmountClass } from '@/utils/formatter';

import CategoryBarChar from './CategoryBarChart';

interface CategoryTableProps {
  transactions: TransactionDto[];
}
export default function CategoryTable({ transactions }: CategoryTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | undefined>();

  // Group transactions by month
  const transactionsByMonth = transactions.reduce<Record<string, TransactionDto[]>>((acc, tx) => {
    const month = monthFormatter.format(tx.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(tx);
    return acc;
  }, {});

  function triggerEditTransaction(transaction: TransactionDto) {
    setEditingTransaction(transaction);
  }

  function renderTransaction(transaction: TransactionDto) {
    return <TransactionCard transaction={transaction} onEdit={triggerEditTransaction} />;
  }

  if (!transactions) return <></>;

  // Handler to close the dialog
  function handleTransactionFormHide() {
    setEditingTransaction(undefined);
  }

  return (
    <>
      <TransactionForm transactionDto={editingTransaction} onHide={handleTransactionFormHide} />
      <Accordion className="category-report" multiple>
        {Object.entries(transactionsByMonth).map(([month, monthTransactions]) => {
          const monthTotal = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
          return (
            <AccordionTab
              key={month}
              header={
                <div className="flex text-xl font-semibold w-full">
                  <div className="flex-grow-1 flex items-center">
                    <strong className="mr-2">{month}</strong>
                    <Tag value={monthTransactions.length} severity="info"></Tag>
                  </div>
                  <strong
                    className={classNames(['font-semibold', transactionAmountClass(monthTotal)])}
                  >
                    {currencyFormatter.format(monthTotal)}
                  </strong>
                </div>
              }
            >
              <CategoryBarChar transactions={monthTransactions} />
              <div className="mt-4">{monthTransactions.map(renderTransaction)}</div>
            </AccordionTab>
          );
        })}
      </Accordion>
    </>
  );
}
