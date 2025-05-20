import { UncategorizedTransaction } from '@/modules/transactions';
import { DataView } from 'primereact/dataview';
import { classNames } from 'primereact/utils';

import { updateCategoryAction } from '@/actions/transactions';
import { Category } from '@/prisma';

import CategoryDropdown from './CategoryDropDown';

interface UncategorizedTransactionRowProps {
  transactions: UncategorizedTransaction[];
}

export default function UncategorizedTransactions({
  transactions,
}: UncategorizedTransactionRowProps) {
  async function handleCategoryChange(transaction: UncategorizedTransaction, category: Category) {
    await updateCategoryAction(transaction.ids, category.id);
  }

  function listTemplate(items: UncategorizedTransaction[]) {
    return items.map((transaction, index) => (
      <div
        className={classNames(
          'col-12 border-b-1 border-gray-200 p-4',
          index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100',
        )}
        key={transaction.ids.join(',')}
      >
        <div className="">
          <div className=" flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
            <div className="flex flex-grow-1 flex-column align-items-center sm:align-items-start gap-3">
              <div className="text-900">{transaction.descriptions.join(',')}</div>
            </div>
            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
              <span className="font-semibold text-end text-nowrap">
                {transaction.values
                  .map((value) =>
                    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  )
                  .join(',')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-grow-1">
          <CategoryDropdown onChange={(category) => handleCategoryChange(transaction, category)} />
        </div>
      </div>
    ));
  }

  return (
    <div className="card">
      <DataView value={transactions} layout="list" listTemplate={listTemplate} />
    </div>
  );
}
