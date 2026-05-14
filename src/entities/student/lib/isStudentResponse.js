/**
 * @param {unknown} data
 * @returns {boolean}
 */
export function isStudentResponseShape(data) {
  if (!data || typeof data !== 'object') return false;
  const o = /** @type {Record<string, unknown>} */ (data);
  return (
    typeof o.id === 'number' &&
    typeof o.login === 'string' &&
    typeof o.firstName === 'string' &&
    typeof o.lastName === 'string'
  );
}
