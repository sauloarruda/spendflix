import { TransactionDto } from '@/actions/transactions';

import CategoryBarChar from './CategoryBarChart';
import CategoryFilter from './CategoryFilter';
import CategoryTable from './CategoryTable';

interface CategoryReportProps {
  transactions: TransactionDto[];
}
export default function CategoryReport({ transactions }: CategoryReportProps) {
  return (
    <>
      <CategoryFilter />
      <CategoryBarChar transactions={transactions} />
      <CategoryTable transactions={transactions} />
    </>
  );
}
