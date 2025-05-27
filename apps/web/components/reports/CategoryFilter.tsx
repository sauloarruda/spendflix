import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef, useState } from 'react';

import { TransactionDto } from '@/actions/transactions';
import { monthFormatter } from '@/utils/formatter';

export type CategoryReportFilters = {
  category?: string[];
  month?: string[];
  text?: string;
};

interface CategoryFilterProps {
  title: string;
  transactions: TransactionDto[];
  onChange: (filter: CategoryReportFilters) => void;
}

export default function CategoryFilter({ title, transactions, onChange }: CategoryFilterProps) {
  const [filter, setFilter] = useState<CategoryReportFilters>({});
  const filterFormOverlay = useRef<OverlayPanel>(null);

  function handleChangeFilter(name: keyof CategoryReportFilters, value: string[] | string) {
    const updateFilter = { ...filter };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      updateFilter[name] = undefined;
    } else if (name === 'category' || name === 'month') {
      updateFilter[name] = value as string[];
    } else if (name === 'text') {
      updateFilter[name] = value as string;
    }
    setFilter(updateFilter);
    onChange(updateFilter);
  }

  function handleChangeTextFilter(value: string) {
    handleChangeFilter('text', value);
  }

  function filtersBadge() {
    let count = 0;
    if (filter.category?.length) count += filter.category.length;
    if (filter.month?.length) count += filter.month.length;
    if (filter.text) count += 1;
    return count > 0 ? count.toString() : undefined;
  }

  return (
    <div className="flex border-b-1 p-2 items-center mb-4">
      <h1 className="text-2xl flex-grow-1">{title}</h1>
      <Button
        className="text-white"
        raised
        icon="pi pi-filter"
        size="small"
        badge={filtersBadge()}
        aria-label="Filter"
        onClick={(e) => filterFormOverlay.current?.toggle(e)}
      />
      <OverlayPanel ref={filterFormOverlay} showCloseIcon>
        <div className="flex flex-col gap-4 min-w-[300px]">
          <InputText
            value={filter.text || ''}
            onChange={(e) => handleChangeTextFilter(e.target.value)}
            placeholder="Buscar por texto"
            className="mb-2"
          />
          <div className="flex gap-4">
            <MultiSelect
              value={filter.category}
              onChange={(e) => handleChangeFilter('category', e.value)}
              options={[...new Set(transactions.map((tx) => tx.categoryName))].sort()}
              placeholder="Filtrar categorias"
            />
            <MultiSelect
              value={filter.month}
              onChange={(e) => handleChangeFilter('month', e.value)}
              options={[...new Set(transactions.map((tx) => monthFormatter.format(tx.date)))]}
              placeholder="Filtrar mês"
            />
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
}
