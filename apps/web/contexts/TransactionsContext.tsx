import { useRouter } from 'next/navigation';
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
  const [transactions, setTransactions] = useState<TransactionDto[]>();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const fetchedTransactions = await autorizeAction<TransactionDto[]>(getSessionCookie(), () =>
          getTransactionsByFilterAction({ userId }),
        );
        setTransactions(fetchedTransactions);
      } catch (error) {
        setTransactions([]);
        if (error instanceof InvalidAuthenticationError) router.push('/401');
      }
    }
    fetchTransactions();
  }, [userId, router]);

  return (
    <TransactionsContext.Provider value={transactions}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}
