/**
 * Единый расчёт % посещаемости.
 *
 * Источник `exist` (админка, секция): одна отметка на дату.
 * Источник `attendanceMap`: несколько слотов на дату — для % считаем по дням
 * (день = присутствие, если хотя бы один слот с isExists === true), как на бэкенде в exist.
 */

/**
 * @param {import('../../../entities/student/model/types').StudentExistMap | undefined | null} exist
 * @returns {number}
 */
export function computeAttendanceFromExist(exist) {
  if (!exist || typeof exist !== 'object') return 0;
  const values = Object.values(exist);
  if (values.length === 0) return 0;
  const present = values.reduce((acc, v) => acc + (v === true ? 1 : 0), 0);
  return Math.round((present / values.length) * 100);
}

/**
 * % посещаемости по занятиям (слотам) — согласован с подсчётом пропусков по слотам.
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} map
 * @returns {number | null}
 */
export function computePercentFromAttendanceMapBySlot(map) {
  if (!map || typeof map !== 'object') return null;
  let total = 0;
  let present = 0;
  Object.values(map).forEach((slots) => {
    if (!Array.isArray(slots)) return;
    slots.forEach((slot) => {
      total += 1;
      if (slot?.isExists === true) present += 1;
    });
  });
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/**
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} map
 * @returns {number | null}
 */
export function computePercentFromAttendanceMapByDay(map) {
  if (!map || typeof map !== 'object') return null;
  const daySlots = Object.values(map).filter((slots) => Array.isArray(slots) && slots.length > 0);
  if (daySlots.length === 0) return 0;
  const presentDays = daySlots.filter((slots) =>
    slots.some((slot) => slot?.isExists === true)
  ).length;
  return Math.round((presentDays / daySlots.length) * 100);
}

/**
 * Полностью пропущенные дни (нет ни одного слота с isExists).
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} map
 * @returns {number | null}
 */
export function computeAbsencesFromAttendanceMapByDay(map) {
  if (!map || typeof map !== 'object') return null;
  const daySlots = Object.values(map).filter((slots) => Array.isArray(slots) && slots.length > 0);
  if (daySlots.length === 0) return 0;
  return daySlots.filter((slots) => !slots.some((slot) => slot?.isExists === true)).length;
}

/**
 * Пропущенные занятия (каждый слот с isExists !== true), как GET /api/visits/get-total-absences.
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} map
 * @returns {number | null}
 */
export function computeAbsencesFromAttendanceMapBySlot(map) {
  if (!map || typeof map !== 'object') return null;
  let absences = 0;
  Object.values(map).forEach((slots) => {
    if (!Array.isArray(slots)) return;
    slots.forEach((slot) => {
      if (slot?.isExists !== true) absences += 1;
    });
  });
  return absences;
}

/**
 * История / карта посещений: % и пропуски из одного источника (attendanceMap по слотам).
 * Секция и админка: только exist (по дням) — см. computeAttendanceFromExist.
 *
 * @param {{ exist?: Record<string, boolean> } | null | undefined} student
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} attendanceMap
 * @returns {number}
 */
export function computeAttendancePercentUnified(student, attendanceMap) {
  if (attendanceMap && typeof attendanceMap === 'object' && Object.keys(attendanceMap).length > 0) {
    return computePercentFromAttendanceMapBySlot(attendanceMap) ?? 0;
  }
  if (student?.exist && typeof student.exist === 'object' && Object.keys(student.exist).length > 0) {
    return computeAttendanceFromExist(student.exist);
  }
  return 0;
}

/**
 * Пропуски: по занятиям из attendanceMap (совпадает с таблицей истории и total-absences на бэке).
 * Без карты — по дням из exist.
 *
 * @param {{ exist?: Record<string, boolean> } | null | undefined} student
 * @param {Record<string, Array<{ isExists?: boolean }>> | null | undefined} attendanceMap
 * @returns {number}
 */
export function computeAbsencesUnified(student, attendanceMap) {
  if (attendanceMap && typeof attendanceMap === 'object' && Object.keys(attendanceMap).length > 0) {
    return computeAbsencesFromAttendanceMapBySlot(attendanceMap) ?? 0;
  }
  if (student?.exist && typeof student.exist === 'object' && Object.keys(student.exist).length > 0) {
    return Object.values(student.exist).filter((v) => v !== true).length;
  }
  return 0;
}
