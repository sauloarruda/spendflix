import useSWR from 'swr';

import { Category } from '@/prisma';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  });

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>('/api/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    categories: data,
    isLoading,
    error,
  };
}
