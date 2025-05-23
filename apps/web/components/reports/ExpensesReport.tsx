import { TransactionDto } from '@/actions/transactions';
import { useTransactions } from '@/contexts/TransactionsContext';

import CategoryReport from './CategoryReport';

export default function ExpensesReport() {
  const transactions = useTransactions();

  if (!transactions) return <></>;

  const ignoredCategories = ['Receitas', 'Investimento'];
  const expensesTransactions = transactions.filter(
    (transaction: TransactionDto) => !ignoredCategories.includes(transaction.categoryName),
  );

  if (!expensesTransactions) return <></>;
  return (
    <>
      <CategoryReport title="Minhas Despesas" transactions={expensesTransactions} />
    </>
  );
}
