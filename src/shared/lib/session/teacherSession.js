const STORAGE_KEY = 'teacherSession';

/** @returns {{ id: number, login: string, firstName: string, lastName: string, patronymic?: string } | null} */
export function getTeacherSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setTeacherSession(teacher) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: teacher.id,
      login: teacher.login,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      patronymic: teacher.patronymic,
    })
  );
}

export function clearTeacherSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function formatPersonName(person) {
  if (!person) return '';
  return `${person.lastName || ''} ${person.firstName || ''} ${person.patronymic || ''}`.trim();
}
