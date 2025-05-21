import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef, useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import { monthFormat } from 'utils/formatter';

export type CategoryReportFilters = {
  category?: string[];
  month?: string[];
};

interface CategoryFilterProps {
  title: string;
  transactions: TransactionDto[];
  onChange: (filter: CategoryReportFilters) => void;
}

export default function CategoryFilter({ title, transactions, onChange }: CategoryFilterProps) {
  const [filter, setFilter] = useState<CategoryReportFilters>({});
  const filterFormOverlay = useRef<OverlayPanel>(null);

  function handleChangeFilter(name: keyof CategoryReportFilters, value: string[]) {
    const updateFilter = { ...filter };
    if (!value || value.length === 0) {
      updateFilter[name] = undefined;
    } else {
      updateFilter[name] = value;
    }
    setFilter(updateFilter);
    onChange(updateFilter);
  }
  return (
    <div className="flex border-b-1 p-2 items-center mb-4">
      <h1 className="text-2xl flex-grow-1">{title}</h1>
      <Button
        icon="pi pi-filter"
        size="small"
        rounded
        outlined
        aria-label="Filter"
        onClick={(e) => filterFormOverlay.current?.toggle(e)}
      />
      <OverlayPanel ref={filterFormOverlay} showCloseIcon>
        <div className="flex gap-4">
          <MultiSelect
            value={filter.category}
            onChange={(e) => handleChangeFilter('category', e.value)}
            options={[...new Set(transactions.map((tx) => tx.category))].sort()}
            placeholder="Filtrar categorias"
          />
          <MultiSelect
            value={filter.month}
            onChange={(e) => handleChangeFilter('month', e.value)}
            options={[...new Set(transactions.map((tx) => monthFormat.format(tx.date)))]}
            placeholder="Filtrar mês"
          />
        </div>
      </OverlayPanel>
    </div>
  );
}
