import { TransactionDto } from '@/actions/transactions';
import { useTransactions } from '@/contexts/TransactionsContext';

import CategoryBarChar from './CategoryBarChart';
import CategoryTable from './CategoryTable';

export default function RevenueReport() {
  const transactions = useTransactions();

  if (!transactions) return <></>;

  const revenueTransactions = transactions.filter(
    (transaction: TransactionDto) => transaction.category === 'Receitas',
  );

  if (!revenueTransactions) return <></>;
  return (
    <>
      <h1>Minhas Receitas</h1>
      <CategoryBarChar transactions={revenueTransactions} />
      <CategoryTable transactions={revenueTransactions} />
    </>
  );
}
