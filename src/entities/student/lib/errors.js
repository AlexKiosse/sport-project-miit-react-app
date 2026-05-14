/**
 * 400 при создании: логин занят. В теле ответа — существующий студент (модель Student).
 */
export class CreateStudentDuplicateLoginError extends Error {
  /**
   * @param {string} message
   * @param {import('../model/types').Student} existingStudent
   */
  constructor(message, existingStudent) {
    super(message);
    this.name = 'CreateStudentDuplicateLoginError';
    this.existingStudent = existingStudent;
  }
}
