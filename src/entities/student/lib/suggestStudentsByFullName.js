import { formatStudentFullName } from './formatStudentFullName';

/**
 * Подсказки по префиксу фамилии/имени (и отчества, если указано) среди уже загруженных студентов.
 *
 * @param {Array<{ id?: number, lastName?: string, firstName?: string, patronymic?: string, login?: string }>} students
 * @param {{ lastName?: string, firstName?: string, patronymic?: string }} query
 * @param {number} [limit]
 */
export function suggestStudentsByFullName(students, query, limit = 10) {
  const lastName = (query.lastName || '').trim().toLowerCase();
  const firstName = (query.firstName || '').trim().toLowerCase();
  const patronymic = (query.patronymic || '').trim().toLowerCase();

  if (lastName.length < 1 && firstName.length < 1) {
    return [];
  }

  const matches = students.filter((student) => {
    const sLast = (student.lastName || '').toLowerCase();
    const sFirst = (student.firstName || '').toLowerCase();
    const sPat = (student.patronymic || '').toLowerCase();

    if (lastName && !sLast.startsWith(lastName)) return false;
    if (firstName && !sFirst.startsWith(firstName)) return false;
    if (patronymic && !sPat.startsWith(patronymic)) return false;
    return true;
  });

  matches.sort((a, b) =>
    formatStudentFullName(a).localeCompare(formatStudentFullName(b), 'ru', {
      sensitivity: 'base',
    })
  );

  return matches.slice(0, limit);
}
