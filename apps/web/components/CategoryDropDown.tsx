import { Dropdown } from 'primereact/dropdown';
import { useEffect, useState } from 'react';

import { getCategoriesAction } from '@/actions/categories';
import { Category } from '@/prisma';

interface CategoryDropdownProps {
  onChange: (category: Category) => void;
  value?: Category;
}
export default function CategoryDropdown({ onChange, value }: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>();
  const [selectedCategory, setSelectedCategory] = useState<Category>(value);
  useEffect(() => {
    const fetchCategories = async () => {
      setCategories(await getCategoriesAction());
    };
    fetchCategories();
  }, []);

  function handleChange(event: { value: Category }) {
    setSelectedCategory(event.value);
    onChange(event.value);
  }

  return (
    <Dropdown
      value={selectedCategory}
      options={categories}
      optionLabel="name"
      onChange={handleChange}
      placeholder="Escolha uma categoria"
    ></Dropdown>
  );
}
