import React from 'react';
import './sortable-th.css';

/**
 * @param {{
 *   label: string,
 *   columnKey: string,
 *   sortKey: string|null,
 *   sortDirection: 'asc'|'desc',
 *   onSort: (key: string) => void,
 *   className?: string,
 * }} props
 */
export const SortableTh = ({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className = '',
}) => {
  const isActive = sortKey === columnKey;
  const ariaSort = isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th scope="col" className={className} aria-sort={ariaSort}>
      <button
        type="button"
        className={`sortable-th${isActive ? ` sortable-th--active sortable-th--${sortDirection}` : ''}`}
        onClick={() => onSort(columnKey)}
      >
        <span>{label}</span>
        <span className="sortable-th-icon" aria-hidden />
      </button>
    </th>
  );
};
