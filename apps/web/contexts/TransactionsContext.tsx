import { useRouter } from 'next/navigation';
import { Skeleton } from 'primereact/skeleton';
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

import { TransactionDto } from '@/actions/transactions';

interface TransactionsProviderProps {
  userId: number;
  children: ReactNode;
}

const TransactionsContext = createContext<TransactionDto[] | undefined>(undefined);

export function TransactionsProvider({ userId, children }: TransactionsProviderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionDto[]>();
  const lastModifiedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (transactions) return;
    async function fetchTransactions() {
      try {
        const headers: HeadersInit = {};
        if (lastModifiedRef.current) {
          headers['If-Modified-Since'] = lastModifiedRef.current;
        }
        const res = await fetch(`/api/transactions?userId=${userId}`, {
          headers,
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push('/401');
          return;
        }
        const lastModified = res.headers.get('Last-Modified');
        if (lastModified) {
          lastModifiedRef.current = lastModified;
        }
        if (res.status === 304) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const fetchedTransactions = await res.json();
        setTransactions(
          fetchedTransactions.map((tx: TransactionDto) => ({
            ...tx,
            date: new Date(tx.date),
            updatedAt: new Date(tx.updatedAt),
          })),
        );
        setLoading(false);
      } catch {
        setTransactions([]);
      }
    }
    fetchTransactions();
  }, [userId, router, transactions, setTransactions]);

  if (loading) return <Skeleton className="lg:w-5/6 md:w-full" height="220px"></Skeleton>;
  return (
    <TransactionsContext.Provider value={transactions}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}
