import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  filterStudentsByLoginSubstring,
  formatStudentFullName,
} from '/entities/student';
import '../../full-name-search/ui/full-name-search.css';

/**
 * @param {{
 *   login: string,
 *   students: Array<import('/entities/student/model/types').Student>,
 *   studentsLoading?: boolean,
 *   onChange: (login: string) => void,
 * }} props
 */
export const LoginSearchField = ({
  login,
  students,
  studentsLoading = false,
  onChange,
}) => {
  const rootRef = useRef(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestions = useMemo(
    () => filterStudentsByLoginSubstring(students, login).slice(0, 12),
    [students, login]
  );

  const showSuggestions =
    suggestionsOpen &&
    !studentsLoading &&
    login.trim().length > 0 &&
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
    onChange(student.login || '');
    setSuggestionsOpen(false);
  };

  return (
    <div className="full-name-search login-search" ref={rootRef}>
      <div className="form-group">
        <label htmlFor="search-login">Логин</label>
        <input
          id="search-login"
          type="text"
          className="form-input"
          placeholder="ivanov"
          autoComplete="off"
          value={login}
          onFocus={() => setSuggestionsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setSuggestionsOpen(true);
          }}
        />
      </div>

      {studentsLoading ? (
        <p className="form-hint full-name-search-hint">Загрузка списка студентов для подсказок…</p>
      ) : null}

      {showSuggestions ? (
        <ul className="full-name-suggestions" role="listbox" aria-label="Подсказки по логину">
          {suggestions.map((student) => (
            <li key={student.id ?? student.login}>
              <button
                type="button"
                className="full-name-suggestion-item"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(student)}
              >
                <span className="full-name-suggestion-login mono">{student.login}</span>
                <span className="full-name-suggestion-name">{formatStudentFullName(student)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
