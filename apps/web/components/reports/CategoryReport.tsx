import { useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import { monthFormat } from 'utils/formatter';

import CategoryBarChar from './CategoryBarChart';
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
    console.log(filter);
    setFilteredTransactions(
      originalTransactions.filter((tx) => {
        let shouldFilter = true;
        if (
          filter.category &&
          filter.category.length > 0 &&
          !filter.category.includes(tx.category)
        ) {
          shouldFilter = false;
        }
        if (
          filter.month &&
          filter.month.length > 0 &&
          !filter.month.includes(monthFormat.format(tx.date))
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
      <CategoryBarChar transactions={filteredTransactions} />
      <CategoryTable transactions={filteredTransactions} />
    </>
  );
}
