const STORAGE_KEY = 'teacherSectionLastSeen';

export function getSectionLastSeen(sectionId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[String(sectionId)] || null;
  } catch {
    return null;
  }
}

export function markSectionSeen(sectionId) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  data[String(sectionId)] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
