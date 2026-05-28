import React from 'react';
import './enrolled-sections-list.css';

/**
 * @param {{
 *   sections: Array<{ id?: number, name?: string, description?: string, enrolledAt?: string|null }>,
 *   loading?: boolean,
 *   emptyText?: string,
 * }} props
 */
export const EnrolledSectionsList = ({
  sections,
  loading = false,
  emptyText = 'Нет записей в спортивные секции',
}) => {
  if (loading) {
    return <p className="enrolled-sections-empty">Загрузка секций…</p>;
  }

  if (!sections?.length) {
    return <p className="enrolled-sections-empty">{emptyText}</p>;
  }

  return (
    <ul className="enrolled-sections-list">
      {sections.map((section) => (
        <li key={section.id ?? section.name} className="enrolled-sections-item">
          <span className="enrolled-sections-name">{section.name}</span>
          {section.description ? (
            <span className="enrolled-sections-desc">{section.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
};
