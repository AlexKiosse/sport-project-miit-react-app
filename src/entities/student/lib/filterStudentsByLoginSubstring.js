/**
 * Поиск студентов по подстроке логина (без учёта регистра).
 *
 * @param {Array<{ login?: string }>} students
 * @param {string} loginQuery
 */
export function filterStudentsByLoginSubstring(students, loginQuery) {
  const query = loginQuery.trim().toLowerCase();
  if (!query) return [];

  return students
    .filter((student) => (student.login || '').toLowerCase().includes(query))
    .sort((a, b) => (a.login || '').localeCompare(b.login || '', 'ru', { sensitivity: 'base' }));
}
