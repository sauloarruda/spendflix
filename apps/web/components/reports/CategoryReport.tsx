import { Message } from 'primereact/message';
import { useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import { monthFormatter } from 'utils/formatter';

import CategoryFilter, { CategoryReportFilters } from './CategoryFilter';
import CategoryTable from './CategoryTable';

interface CategoryReportProps {
  title: string;
  transactions: TransactionDto[];
}
export default function CategoryReport({
  transactions: originalTransactions,
  title,
}: CategoryReportProps) {
  const [filteredTransactions, setFilteredTransactions] =
    useState<TransactionDto[]>(originalTransactions);
  function handleChangeFilter(filter: CategoryReportFilters) {
    setFilteredTransactions(
      originalTransactions.filter((tx) => {
        let shouldFilter = true;
        if (
          filter.category &&
          filter.category.length > 0 &&
          !filter.category.includes(tx.categoryName)
        ) {
          shouldFilter = false;
        }
        if (
          filter.month &&
          filter.month.length > 0 &&
          !filter.month.includes(monthFormatter.format(tx.date))
        ) {
          shouldFilter = false;
        }
        return shouldFilter;
      }),
    );
  }
  return (
    <>
      <CategoryFilter
        title={title}
        transactions={originalTransactions}
        onChange={handleChangeFilter}
      />
      {filteredTransactions.length === 0 ? (
        <Message text="Nenhum lançamento encontrado"></Message>
      ) : (
        <CategoryTable transactions={filteredTransactions} />
      )}
    </>
  );
}
