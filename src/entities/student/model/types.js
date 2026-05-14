/**
 * Присутствие по датам занятий: ключ — дата `YYYY-MM-DD`, значение — был (`true`) или прогул (`false`).
 *
 * @typedef {Object.<string, boolean>} StudentExistMap
 */

/**
 * Студент в ответах API (форма JSON).
 *
 * @typedef {Object} Student
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} patronymic
 * @property {string} login
 * @property {number} healthGroup
 * @property {string} groupName
 * @property {StudentExistMap} exist
 */

/**
 * Тело запроса создания студента (JSON API).
 *
 * @typedef {Object} CreateStudent
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} patronymic
 * @property {string} login
 * @property {string} password
 * @property {number} health_group_id
 * @property {number} group_id
 * @property {(string|null)} [birthday] Дата рождения YYYY-MM-DD; можно не передавать или передать null.
 */

export {};
