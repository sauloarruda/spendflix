import { Dropdown } from 'primereact/dropdown';
import { useEffect, useState } from 'react';

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
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategoriesAction();
      setCategories(result);

      console.log(categoryId, result);
      if (categoryId) setSelectedCategory(result.find((cat) => cat.id === categoryId));
    };
    fetchCategories();
  }, [categoryId]);

  function handleChange(event: { value: Category }) {
    setSelectedCategory(event.value);
    onChange(event.value);
  }

  return (
    <Dropdown
      inputId="category"
      value={selectedCategory}
      options={categories}
      optionLabel="name"
      onChange={handleChange}
      placeholder="Escolha uma categoria"
    ></Dropdown>
  );
}
