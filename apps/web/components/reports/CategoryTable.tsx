import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import {
  currencyFormatter,
  dayFormatter,
  monthFormatter,
  transactionAmountClass,
} from 'utils/formatter';

import TransactionForm from '../forms/TransactionForm';

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
            onClick={() => triggerEditTransaction(transaction)}
          ></Button>
        </div>
        <div className="flex-1">
          <div className="mb-1">
            <span
              className="inline-block rounded px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: `var(--${transaction.categoryColor})` }}
            >
              {transaction.categoryName}
            </span>
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
                  <div className="flex-grow-1">{month}</div>
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
