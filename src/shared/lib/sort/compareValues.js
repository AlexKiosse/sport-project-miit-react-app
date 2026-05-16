/**
 * @param {string|number|null|undefined} a
 * @param {string|number|null|undefined} b
 * @param {'asc'|'desc'} direction
 */
export function compareValues(a, b, direction = 'asc') {
  const mult = direction === 'asc' ? 1 : -1;

  const aEmpty = a == null || a === '';
  const bEmpty = b == null || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1 * mult;
  if (bEmpty) return -1 * mult;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * mult;
  }

  return String(a).localeCompare(String(b), 'ru', { sensitivity: 'base', numeric: true }) * mult;
}
