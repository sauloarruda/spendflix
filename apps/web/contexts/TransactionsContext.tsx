import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { getTransactionsByFilterAction, TransactionDto } from '@/actions/transactions';

interface TransactionsProviderProps {
  userId: number;
  children: ReactNode;
}

const TransactionsContext = createContext<TransactionDto[] | undefined>(undefined);

export function TransactionsProvider({ userId, children }: TransactionsProviderProps) {
  const [transactions, setTransactions] = useState<TransactionDto[]>();

  useEffect(() => {
    getTransactionsByFilterAction({ userId }).then(setTransactions);
  }, [userId]);

  return (
    <TransactionsContext.Provider value={transactions}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}
