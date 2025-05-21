import { TransactionDto } from '@/actions/transactions';
import { useTransactions } from '@/contexts/TransactionsContext';

import CategoryReport from './CategoryReport';

export default function RevenueReport() {
  const transactions = useTransactions();

  if (!transactions) return <></>;

  const revenueTransactions = transactions.filter(
    (transaction: TransactionDto) => transaction.category === 'Receitas',
  );

  if (!revenueTransactions) return <></>;
  return (
    <>
      <CategoryReport title="Minhas Receitas" transactions={revenueTransactions} />
    </>
  );
}
