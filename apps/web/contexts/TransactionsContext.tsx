import { useRouter } from 'next/navigation';
import { Skeleton } from 'primereact/skeleton';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { autorizeAction, InvalidAuthenticationError } from '@/actions/serverActions';
import { getTransactionsByFilterAction, TransactionDto } from '@/actions/transactions';
import { getSessionCookie } from '@/utils/cookie';

interface TransactionsProviderProps {
  userId: number;
  children: ReactNode;
}

const TransactionsContext = createContext<TransactionDto[] | undefined>(undefined);

export function TransactionsProvider({ userId, children }: TransactionsProviderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionDto[]>();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const fetchedTransactions = await autorizeAction<TransactionDto[]>(getSessionCookie(), () =>
          getTransactionsByFilterAction({ userId }),
        );
        setTransactions(fetchedTransactions);
        setLoading(false);
      } catch (error) {
        setTransactions([]);
        if (error instanceof InvalidAuthenticationError) router.push('/401');
      }
    }
    fetchTransactions();
  }, [userId, router]);

  if (loading) return <Skeleton className="lg:w-5/6 md:w-full" height="220px"></Skeleton>;
  return (
    <TransactionsContext.Provider value={transactions}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}
