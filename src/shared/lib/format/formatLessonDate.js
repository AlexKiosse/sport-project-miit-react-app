import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

/** @param {string} dateStr */
export function formatLessonDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, 'd MMMM yyyy', { locale: ru });
}

/** @param {string} dateStr */
export function formatLessonDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, 'dd.MM.yyyy');
}
