/**
 * Посещаемость по карте `exist`: ключ — дата (YYYY-MM-DD), значение — присутствие на занятии.
 * Все записи в `exist` задают полный набор занятий (100% объёма); `true` — пришёл, `false` — прогул.
 * Формула: (количество `true` / количество записей) × 100%.
 *
 * @param {import('../model/types').StudentExistMap | undefined | null} exist
 * @returns {number} Целый процент от 0 до 100 (округление).
 */
export function computeAttendanceFromExist(exist) {
  if (!exist || typeof exist !== 'object') return 0;
  const values = Object.values(exist);
  if (values.length === 0) return 0;
  const present = values.reduce((acc, v) => acc + (v === true ? 1 : 0), 0);
  return Math.round((present / values.length) * 100);
}
