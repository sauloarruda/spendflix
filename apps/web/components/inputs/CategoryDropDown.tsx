import { Dropdown, DropdownProps } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';
import { cache, useEffect, useState } from 'react';

import { getCategoriesAction } from '@/actions/categories';
import { Category } from '@/prisma';

interface CategoryDropdownProps {
  onChange: (category: Category) => void;
  value?: Category | null;
  categoryId?: string | null;
}
export default function CategoryDropdown({ onChange, value, categoryId }: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>();
  const [selectedCategory, setSelectedCategory] = useState<Category | null | undefined>(value);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategories = cache(async () => {
      const result = await getCategoriesAction();
      setCategories(result);
      if (categoryId) setSelectedCategory(result.find((cat) => cat.id === categoryId));
      setLoading(false);
    });
    fetchCategories();
  }, [categoryId]);

  function handleChange(event: { value: Category }) {
    setSelectedCategory(event.value);
    onChange(event.value);
  }

  function itemTemplate(option: Category) {
    return (
      <span
        className="px-2 py-1 rounded-lg"
        style={{ color: 'white', backgroundColor: `var(--${option.color})` }}
      >
        {option.name}
      </span>
    );
  }

  function valueTemplate(option: Category, props: DropdownProps) {
    if (!option) return <span>{props.placeholder}</span>;
    return itemTemplate(option);
  }

  return loading ? (
    <Skeleton width="15em" height="3.5em"></Skeleton>
  ) : (
    <Dropdown
      className="w-[15em]"
      inputId="category"
      value={selectedCategory}
      options={categories}
      optionLabel="name"
      itemTemplate={itemTemplate}
      valueTemplate={valueTemplate}
      onChange={handleChange}
      placeholder="Escolha uma categoria"
      filter
    ></Dropdown>
  );
}
