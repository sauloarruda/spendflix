import { Dialog } from 'primereact/dialog';
import { FloatLabel } from 'primereact/floatlabel';
import { classNames } from 'primereact/utils';
import { useState, useEffect } from 'react';

import {
  findTransactionByIdAction,
  TransactionDto,
  updateCategoryAction,
} from '@/actions/transactions';
import { Category, Transaction } from '@/prisma';
import { currencyFormatter, dateFormatter, transactionAmountClass } from 'utils/formatter';

import CategoryDropdown from '../CategoryDropDown';

interface TransactionFormProps {
  transactionDto: TransactionDto | undefined;
  onHide: () => void;
  onChange: (transactionDto: TransactionDto) => void;
}
export default function TransactionForm({
  transactionDto,
  onHide,
  onChange,
}: TransactionFormProps) {
  const [formState, setFormState] = useState<TransactionDto | undefined>(transactionDto);
  const [transaction, setTransaction] = useState<Transaction & { amount: number }>();

  useEffect(() => {
    setFormState(transactionDto);

    const fetchTransaction = async (id: string) => {
      setTransaction(await findTransactionByIdAction(id));
    };

    if (transactionDto) fetchTransaction(transactionDto.id);
  }, [transactionDto]);

  async function handleUpdateCategory(category: Category) {
    if (!formState) throw new Error('Form not defined');
    const id = formState.id!;
    await updateCategoryAction([id], category.id);
    formState.categoryName = category.name;
    formState.categoryColor = category.color;
    onChange(formState);
  }

  if (!formState || !transaction) return <></>;
  return (
    <Dialog
      onHide={onHide}
      visible={transaction !== undefined}
      header="Editar Lançamento"
      style={{ width: '90vw' }}
    >
      <div className="grid grid-cols-1">
        <div className="flex mb-2 items-end">
          <div className="grow grid grid-cols-1">
            <div className="text-blue-500 text-sm">{dateFormatter.format(formState.date)}</div>
            <div>
              <span
                className="p-tag"
                style={{ backgroundColor: `var(--${formState.accountColor})` }}
              >
                {formState.accountName}
              </span>
            </div>
          </div>
          <strong
            className={classNames([
              'text-2xl font-semibold text-nowrap',
              transactionAmountClass(formState.amount),
            ])}
          >
            {currencyFormatter.format(formState.amount)}
          </strong>
        </div>
        <div className="">{formState.description}</div>
        <div className="mt-12 grow">
          <FloatLabel>
            <CategoryDropdown categoryId={transaction.categoryId} onChange={handleUpdateCategory} />
            <label htmlFor="category">Categoria</label>
          </FloatLabel>
        </div>
      </div>
    </Dialog>
  );
}
