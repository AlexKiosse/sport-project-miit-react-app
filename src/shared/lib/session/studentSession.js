const STORAGE_KEY = 'studentSession';

/** @returns {{ id: number, login: string, firstName: string, lastName: string, patronymic?: string } | null} */
export function getStudentSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStudentSession(student) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: student.id,
      login: student.login,
      firstName: student.firstName,
      lastName: student.lastName,
      patronymic: student.patronymic,
    })
  );
}

export function clearStudentSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export { formatPersonName } from './teacherSession';
