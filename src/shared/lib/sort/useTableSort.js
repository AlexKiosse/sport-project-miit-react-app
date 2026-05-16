import { useState, useCallback, useMemo } from 'react';
import { compareValues } from './compareValues';

/**
 * @template T
 * @param {string|null} [defaultKey]
 * @param {'asc'|'desc'} [defaultDirection]
 */
export function useTableSort(defaultKey = null, defaultDirection = 'asc') {
  const [sort, setSort] = useState({ key: defaultKey, direction: defaultDirection });

  const toggleSort = useCallback((key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const sortItems = useCallback(
    (items, accessors) => {
      if (!sort.key || !accessors[sort.key]) return items;
      const getValue = accessors[sort.key];
      return [...items].sort((a, b) =>
        compareValues(getValue(a), getValue(b), sort.direction)
      );
    },
    [sort]
  );

  return useMemo(
    () => ({
      sortKey: sort.key,
      sortDirection: sort.direction,
      toggleSort,
      sortItems,
    }),
    [sort.key, sort.direction, toggleSort, sortItems]
  );
}
