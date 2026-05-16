/**
 * Подпись мед. группы для UI: «Основная (1)».
 * @param {{ id?: number, name?: number|string, description?: string }|null|undefined} healthGroup
 */
export function formatHealthGroupLabel(healthGroup) {
  if (!healthGroup) return '—';

  const number = healthGroup.name ?? healthGroup.id;
  const text =
    healthGroup.description != null && String(healthGroup.description).trim() !== ''
      ? String(healthGroup.description).trim()
      : '';

  if (text && number != null && number !== '') {
    return `${text} (${number})`;
  }
  if (text) return text;
  if (number != null && number !== '') return `Группа ${number}`;
  return '—';
}

/**
 * Значение healthGroup у студента → подпись по справочнику или число.
 * @param {number|string|null|undefined} value
 * @param {Array<{ id?: number, name?: number|string, description?: string }>} [healthGroupsList]
 */
export function formatHealthGroupValue(value, healthGroupsList = []) {
  if (value == null || value === '') return '—';

  const match = healthGroupsList.find(
    (hg) =>
      hg.id === value ||
      hg.name === value ||
      String(hg.id) === String(value) ||
      String(hg.name) === String(value)
  );

  if (match) return formatHealthGroupLabel(match);
  return String(value);
}
