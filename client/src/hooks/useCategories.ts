import { useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { getCategories } from '@/services/category.service';
import type { Category } from '@/types';

/** Defaults first (no layout jump, works offline), swapped for API data when it arrives. */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [source, setSource] = useState<'default' | 'api'>('default');

  useEffect(() => {
    let active = true;
    getCategories()
      .then((data) => {
        if (active && data.length > 0) {
          setCategories(data);
          setSource('api');
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, source };
};