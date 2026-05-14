/**
 * Приводит ответ поиска к массиву студентов (бэк может вернуть один объект или массив).
 *
 * @param {unknown} data
 * @returns {import('../model/types').Student[]}
 */
export function normalizeStudentListResponse(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && typeof /** @type {{ id?: unknown }} */ (data).id === 'number') {
    return [/** @type {import('../model/types').Student} */ (data)];
  }
  return [];
}
