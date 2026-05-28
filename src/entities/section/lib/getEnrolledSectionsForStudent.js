import { sectionsApi } from '../api/sectionsApi';

/**
 * Секции, в которых состоит студент (по спискам участников каждой секции).
 * @param {string} studentLogin
 * @returns {Promise<Array<{ id: number, name: string, description?: string, enrolledAt?: string|null }>>}
 */
export async function getEnrolledSectionsForStudent(studentLogin) {
  if (!studentLogin?.trim()) return [];

  const allSections = await sectionsApi.getAll();
  const list = Array.isArray(allSections) ? allSections : [];
  if (list.length === 0) return [];

  const enrolled = await Promise.all(
    list.map(async (section) => {
      try {
        const students = await sectionsApi.getStudentsBySectionId(section.id);
        const members = Array.isArray(students) ? students : [];
        const match = members.find((s) => s.login === studentLogin);
        if (!match) return null;

        return {
          id: section.id,
          name: section.name,
          description: section.description,
          enrolledAt: match.sectionEnrolledAt ?? null,
        };
      } catch {
        return null;
      }
    })
  );

  return enrolled
    .filter(Boolean)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru', { sensitivity: 'base' }));
}
