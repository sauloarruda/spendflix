import { UncategorizedTransaction } from '@/modules/transactions';
import { Avatar } from 'primereact/avatar';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { useState } from 'react';

import { updateCategoryAction } from '@/actions/transactions';
import CategoryDropdown from '@/components/inputs/CategoryDropDown';
import { Category } from '@/prisma';
import { transactionAmountClass } from '@/utils/formatter';

interface UncategorizedTransactionRowProps {
  transactions: UncategorizedTransaction[];
  onChange: (editedIds: string[]) => void;
}

export default function UncategorizedTransactions({
  transactions,
  onChange,
}: UncategorizedTransactionRowProps) {
  const [edited, setEdited] = useState<Record<string, boolean>>({});

  async function handleCategoryChange(transaction: UncategorizedTransaction, category: Category) {
    await updateCategoryAction(transaction.ids, category.id);
    setEdited({ ...edited, [transaction.ids.join()]: true });
    onChange(Object.keys(edited));
  }

  function displayDescription(transaction: UncategorizedTransaction) {
    const installmentsRegex = / - Parcela\s+\d+\/\d+/gi;
    const parts = [<>{transaction.descriptions[0].replace(installmentsRegex, '')}</>];
    if (transaction.descriptions.length > 1) {
      parts.push(
        <span className="ml-1 text-gray-400">({transaction.descriptions.length} lançamentos)</span>,
      );
    }
    if (installmentsRegex.test(transaction.descriptions[0])) {
      parts.push(<Tag className="ml-1" value="Parcelado"></Tag>);
    }
    return parts;
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function displayValue(transaction: UncategorizedTransaction) {
    const min = Math.min(...transaction.values);
    const max = Math.max(...transaction.values);
    if (min === max) {
      return <span className={transactionAmountClass(min)}>{formatCurrency(min)}</span>;
    }
    return (
      <>
        <span className={transactionAmountClass(min)}>{formatCurrency(max)}</span>
        <span className="mx-1">a</span>
        <span className={transactionAmountClass(max)}>{formatCurrency(min)}</span>
      </>
    );
  }

  function pendingTransactions(): number {
    return transactions.length - Object.keys(edited).length;
  }

  function pendingTransactionsText(): string {
    const pending = pendingTransactions();
    return pending === 0 ?
      'Todas as transação foram categorizadas' :
      `${pending} Transações Pendentes`;
  }

  function listTemplate(items: UncategorizedTransaction[]) {
    return items.map((transaction) => (
      <div className="my-4 p-4 p-card p-component" key={transaction.ids.join(',')}>
        <div className="text-900 text-sm">{displayDescription(transaction)}</div>
        <div className="">
          <span className="font-semibold text-end text-nowrap">{displayValue(transaction)}</span>
        </div>
        <div className="flex-grow-1 mt-2">
          <CategoryDropdown onChange={(category) => handleCategoryChange(transaction, category)} />
          <Avatar
            hidden={!edited[transaction.ids.join()]}
            className="ml-2"
            style={{ backgroundColor: 'var(--green-700)', color: '#ffffff' }}
            icon="pi pi-check"
            shape="circle"
          />
        </div>
      </div>
    ));
  }

  return (
    <>
      <Message
        className="sticky top-0 z-50"
        text={pendingTransactionsText()}
        severity={pendingTransactions() === 0 ? 'success' : 'info'}
      ></Message>
      {listTemplate(transactions)}
    </>
  );
}
