/**
 * Собирает тело POST /api/students/create (snake_case по Swagger).
 *
 * @param {{
 *   firstName: string,
 *   lastName: string,
 *   patronymic: string,
 *   login: string,
 *   password: string,
 *   healthGroupId: string|number,
 *   groupId: string|number,
 *   birthday: string
 * }} form
 * @returns {import('../model/types').CreateStudent}
 */
export function buildCreateStudentPayload(form) {
  const birthdayTrimmed = form.birthday.trim();
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    patronymic: form.patronymic.trim(),
    login: form.login.trim(),
    password: form.password,
    health_group_id: Number(form.healthGroupId),
    group_id: Number(form.groupId),
    ...(birthdayTrimmed ? { birthday: birthdayTrimmed } : {}),
  };
}
