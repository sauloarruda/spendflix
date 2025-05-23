import { createContext, useContext, useMemo, ReactNode } from 'react';

import { useTransactions } from '@/contexts/TransactionsContext';

import { monthFormatter } from '../utils/formatter';

export type ResultsReportRow = {
  month: string;
  revenue: number;
  expenses: number;
  investment: number;
  result: number;
};

const categoryMapping = {
  revenue: { name: 'Receitas', color: '--green-800' },
  expenses: { name: 'Despesas', color: '--red-800' },
  investment: { name: 'Investimento', color: '--gray-800' },
  result: { name: 'Resultado', color: '--orange-400' },
};

interface ResultsReportProviderProps {
  children: ReactNode;
}

interface ResultsReportContextValue {
  rows: ResultsReportRow[];
  categoryMapping: typeof categoryMapping;
}

const ResultsReportContext = createContext<ResultsReportContextValue | undefined>(undefined);

export function ResultsReportProvider({ children }: ResultsReportProviderProps) {
  const transactions = useTransactions();

  const rows = useMemo(() => {
    if (!transactions) return [];

    const months = new Set<string>();
    const grouped: Record<string, Record<string, number>> = {};

    const ptToEnCategory: Record<string, keyof typeof categoryMapping> = {
      Receitas: 'revenue',
      Despesas: 'expenses',
      Investimento: 'investment',
    };
    transactions.forEach((tx) => {
      const month = monthFormatter.format(tx.date);
      months.add(month);
      const category = ptToEnCategory[tx.categoryName] || 'expenses';
      if (!grouped[category]) grouped[category] = {};
      grouped[category][month] =
        (grouped[category][month] || 0) + (category === 'revenue' ? tx.amount : tx.amount * -1);
    });

    const monthsArray = Array.from(months);
    return monthsArray.map((month) => {
      const revenue = grouped.revenue?.[month] || 0;
      const expenses = grouped.expenses?.[month] || 0;
      const investment = grouped.investment?.[month] || 0;
      const result = revenue - expenses;
      return { month, revenue, expenses, investment, result };
    });
  }, [transactions]);

  return (
    <ResultsReportContext.Provider value={{ rows, categoryMapping }}>
      {children}
    </ResultsReportContext.Provider>
  );
}

export function useResultsReport() {
  return useContext(ResultsReportContext);
}
