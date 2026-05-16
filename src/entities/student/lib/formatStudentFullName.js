/**
 * @param {{ lastName?: string, firstName?: string, patronymic?: string }} student
 */
export function formatStudentFullName(student) {
  return `${student.lastName || ''} ${student.firstName || ''} ${student.patronymic || ''}`.trim();
}
