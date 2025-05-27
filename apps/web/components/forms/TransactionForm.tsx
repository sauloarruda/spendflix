import { Avatar } from 'primereact/avatar';
import { Dialog } from 'primereact/dialog';
import { FloatLabel } from 'primereact/floatlabel';
import { Skeleton } from 'primereact/skeleton';
import { useState, useEffect } from 'react';

import {
  findTransactionByIdAction,
  TransactionDto,
  updateTransactionCategoryAction,
  updateTransactionNotesAction,
} from '@/actions/transactions';
import TransactionHeader from '@/components/forms/TransactionHeader';
import CategoryDropdown from '@/components/inputs/CategoryDropDown';
import TransactionNotes from '@/components/inputs/TransactionNotes';
import { Category, Transaction } from '@/prisma';

interface TransactionFormProps {
  transactionDto: TransactionDto | undefined;
  onHide: () => void;
}
export default function TransactionForm({ transactionDto, onHide }: TransactionFormProps) {
  const [formState, setFormState] = useState<TransactionDto | undefined>(transactionDto);
  const [transaction, setTransaction] = useState<Transaction>();
  const [editedCategory, setEditedCategory] = useState(false);
  const [editedNotes, setEditedNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEditedCategory(false);
    setEditedNotes(false);
    setLoading(true);
    setFormState(transactionDto);

    const fetchTransaction = async (id: string) => {
      setTransaction(await findTransactionByIdAction(id));
      setLoading(false);
    };

    if (transactionDto) fetchTransaction(transactionDto.id);
  }, [transactionDto]);

  async function handleUpdateCategory(category: Category) {
    setEditedCategory(false);
    if (!formState) throw new Error('Form not defined');
    const id = formState.id!;
    await updateTransactionCategoryAction([id], category.id);
    formState.categoryName = category.name;
    formState.categoryColor = category.color;
    setEditedCategory(true);
    setTimeout(() => onHide(), 1000);
  }

  async function handleUpdateNotes(notes: string | null) {
    setEditedNotes(false);
    if (!formState) throw new Error('Form not defined');
    await updateTransactionNotesAction(formState.id, notes);
    formState.notes = notes;
    if (transaction) transaction.notes = notes;
    setEditedNotes(true);
  }

  if (!formState || !transaction) return <></>;
  return (
    <Dialog
      onHide={onHide}
      visible={transaction !== undefined}
      header="Editar Lançamento"
      className="lg:w-1/2 md:w-3/4"
    >
      <div className="grid grid-cols-1">
        <TransactionHeader transaction={formState} />
        <div className="">{formState.description}</div>
        <div className="grid grid-rows-2 w-full">
          {loading ? (
            <>
              <Skeleton className="mt-8 w-full" height="50px"></Skeleton>
              <Skeleton className="mt-8" width="15em" height="50px"></Skeleton>
            </>
          ) : (
            <>
              <div className="mt-8 flex items-center">
                <TransactionNotes notes={transaction.notes} onChange={handleUpdateNotes} />
                <Avatar
                  hidden={!editedNotes}
                  className="ml-2"
                  style={{ backgroundColor: 'var(--green-700)', color: '#ffffff' }}
                  icon="pi pi-check"
                  shape="circle"
                />
              </div>
              <div className="mt-8 flex items-center">
                <FloatLabel>
                  <CategoryDropdown
                    categoryId={transaction.categoryId}
                    onChange={handleUpdateCategory}
                  />
                  <label htmlFor="category">Categoria</label>
                </FloatLabel>
                <Avatar
                  hidden={!editedCategory}
                  className="ml-2"
                  style={{ backgroundColor: 'var(--green-700)', color: '#ffffff' }}
                  icon="pi pi-check"
                  shape="circle"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
