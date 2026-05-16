import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatStudentFullName,
  suggestStudentsByFullName,
} from '/entities/student';
import './full-name-search.css';

/**
 * @param {{
 *   lastName: string,
 *   firstName: string,
 *   patronymic: string,
 *   students: Array<import('/entities/student/model/types').Student>,
 *   studentsLoading?: boolean,
 *   onChange: (patch: { lastName?: string, firstName?: string, patronymic?: string }) => void,
 * }} props
 */
export const FullNameSearchFields = ({
  lastName,
  firstName,
  patronymic,
  students,
  studentsLoading = false,
  onChange,
}) => {
  const rootRef = useRef(null);
  /** true после выбора из подсказки — следующее ручное изменение сбрасывает остальные поля */
  const lockedFromSuggestionRef = useRef(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestions = useMemo(
    () =>
      suggestStudentsByFullName(students, { lastName, firstName, patronymic }, 12),
    [students, lastName, firstName, patronymic]
  );

  const showSuggestions =
    suggestionsOpen &&
    !studentsLoading &&
    (lastName.trim().length > 0 || firstName.trim().length > 0) &&
    suggestions.length > 0;

  useEffect(() => {
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleSelect = (student) => {
    lockedFromSuggestionRef.current = true;
    onChange({
      lastName: student.lastName || '',
      firstName: student.firstName || '',
      patronymic: student.patronymic || '',
    });
    setSuggestionsOpen(false);
  };

  const handleFieldChange = (field, value) => {
    if (lockedFromSuggestionRef.current) {
      lockedFromSuggestionRef.current = false;
      onChange({
        lastName: field === 'lastName' ? value : '',
        firstName: field === 'firstName' ? value : '',
        patronymic: field === 'patronymic' ? value : '',
      });
    } else {
      onChange({ [field]: value });
    }
    setSuggestionsOpen(true);
  };

  return (
    <div className="full-name-search" ref={rootRef}>
      <div className="form-row form-row--triple search-name-row">
        <div className="form-group">
          <label htmlFor="search-last-name">Фамилия</label>
          <input
            id="search-last-name"
            type="text"
            className="form-input"
            placeholder="Иванов"
            autoComplete="off"
            value={lastName}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="search-first-name">Имя</label>
          <input
            id="search-first-name"
            type="text"
            className="form-input"
            placeholder="Иван"
            autoComplete="off"
            value={firstName}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="search-patronymic">Отчество</label>
          <input
            id="search-patronymic"
            type="text"
            className="form-input"
            placeholder="Иванович (необязательно)"
            autoComplete="off"
            value={patronymic}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(e) => handleFieldChange('patronymic', e.target.value)}
          />
        </div>
      </div>

      {studentsLoading ? (
        <p className="form-hint full-name-search-hint">Загрузка списка студентов для подсказок…</p>
      ) : null}

      {showSuggestions ? (
        <ul className="full-name-suggestions" role="listbox" aria-label="Подсказки по ФИО">
          {suggestions.map((student) => (
            <li key={student.id ?? student.login}>
              <button
                type="button"
                className="full-name-suggestion-item"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(student)}
              >
                <span className="full-name-suggestion-name">
                  {formatStudentFullName(student)}
                </span>
                <span className="full-name-suggestion-login mono">{student.login}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
