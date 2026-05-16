import { visitsApi } from '/entities/visit';
import {
  computeAttendanceFromExist,
  computeAttendancePercentUnified,
} from './computeAttendancePercent';

const BATCH_SIZE = 10;

/**
 * Загружает attendanceMap и считает % как в кабинете преподавателя (по занятиям).
 *
 * @param {Array<{ login?: string, exist?: Record<string, boolean> }>} students
 * @returns {Promise<Record<string, number>>} login → процент посещаемости
 */
export async function loadAttendancePercentsForStudents(students) {
  const list = Array.isArray(students) ? students.filter((s) => s?.login) : [];
  const result = {};

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (student) => {
        try {
          const map = await visitsApi.getAttendanceMap(student.login);
          result[student.login] = computeAttendancePercentUnified(student, map);
        } catch {
          result[student.login] = computeAttendanceFromExist(student.exist);
        }
      })
    );
  }

  return result;
}

/**
 * @param {{ login?: string, exist?: Record<string, boolean> } | null | undefined} student
 * @param {Record<string, number> | null | undefined} percentByLogin
 * @returns {number}
 */
export function getAttendancePercentForStudent(student, percentByLogin) {
  if (!student?.login) return 0;
  const cached = percentByLogin?.[student.login];
  if (typeof cached === 'number') return cached;
  return computeAttendanceFromExist(student.exist);
}
