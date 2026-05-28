import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './user-profile.css';
import { studentsApi, computeAttendanceFromExist } from '/entities/student';
import { teachersApi } from '/entities/teacher';
import { healthGroupsApi, formatHealthGroupValue } from '/entities/healthGroup';
import { getEnrolledSectionsForStudent } from '/entities/section';
import { visitsApi } from '/entities/visit';
import { EnrolledSectionsList } from '/shared/ui/enrolled-sections-list';
import { formatPersonName } from '/shared/lib/session/teacherSession';
const EMPTY_FORM = {
  lastName: '',
  firstName: '',
  patronymic: '',
  login: '',
  healthGroupId: '',
};

function countExistEntries(exist) {
  if (!exist || typeof exist !== 'object') return { total: 0, present: 0 };
  const values = Object.values(exist);
  const present = values.filter((v) => v === true).length;
  return { total: values.length, present };
}

/**
 * @param {{
 *   role: 'student' | 'teacher',
 *   login: string,
 *   backTo: string,
 *   onProfileUpdated?: (profile: object) => void,
 * }} props
 */
export const UserProfileContent = ({ role, login, backTo, onProfileUpdated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [healthGroups, setHealthGroups] = useState([]);
  const [enrolledSections, setEnrolledSections] = useState([]);
  const [attendancePercent, setAttendancePercent] = useState(null);
  const [totalAbsences, setTotalAbsences] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const isStudent = role === 'student';

  const loadProfile = useCallback(async () => {
    if (!login) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isStudent) {
        const [student, hgList, studentSections, pct, absences] = await Promise.all([
          studentsApi.getStudentByLogin(login),
          healthGroupsApi.findAll().catch(() => []),
          getEnrolledSectionsForStudent(login).catch(() => []),
          visitsApi.getAttendancePercentage(login).catch(() => null),
          visitsApi.getTotalAbsences(login).catch(() => null),
        ]);
        setProfile(student);
        setHealthGroups(Array.isArray(hgList) ? hgList : []);
        setEnrolledSections(studentSections);
        setAttendancePercent(
          typeof pct === 'number' ? pct : computeAttendanceFromExist(student?.exist)
        );
        let absValue = null;
        if (typeof absences === 'number') {
          absValue = absences;
        } else if (absences && typeof absences === 'object') {
          absValue =
            absences.totalCount ??
            absences.total ??
            (Object.keys(absences).length === 1 ? Object.values(absences)[0] : null);
        }
        setTotalAbsences(absValue);
        setForm({
          lastName: student?.lastName ?? '',
          firstName: student?.firstName ?? '',
          patronymic: student?.patronymic ?? '',
          login: student?.login ?? login,
          healthGroupId: student?.healthGroup != null ? String(student.healthGroup) : '',
        });
      } else {
        const teacher = await teachersApi.findByLogin(login);
        setProfile(teacher);
        setForm({
          lastName: teacher?.lastName ?? '',
          firstName: teacher?.firstName ?? '',
          patronymic: teacher?.patronymic ?? '',
          login: teacher?.login ?? login,
          healthGroupId: '',
        });
      }
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить профиль');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isStudent, login]);

  useEffect(() => {
    if (login) {
      loadProfile();
    }
  }, [login, loadProfile]);

  const existStats = useMemo(() => countExistEntries(profile?.exist), [profile?.exist]);

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSuccess('');
  };

  const handleSave = async () => {
    if (!profile?.login) return;
    const trimmedLogin = form.login.trim();
    const trimmedLast = form.lastName.trim();
    const trimmedFirst = form.firstName.trim();
    const trimmedPatronymic = form.patronymic.trim();

    if (!trimmedLast || !trimmedFirst) {
      setError('Фамилия и имя обязательны');
      return;
    }
    if (!trimmedLogin) {
      setError('Логин не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const currentLogin = profile.login;

    try {
      const nameChanged =
        trimmedLast !== (profile.lastName ?? '') ||
        trimmedFirst !== (profile.firstName ?? '') ||
        trimmedPatronymic !== (profile.patronymic ?? '');
      const loginChanged = trimmedLogin !== currentLogin;

      if (nameChanged) {
        if (isStudent) {
          await studentsApi.updateFullName(
            currentLogin,
            trimmedFirst,
            trimmedLast,
            trimmedPatronymic
          );
        } else {
          await teachersApi.updateFullName(
            currentLogin,
            trimmedFirst,
            trimmedLast,
            trimmedPatronymic
          );
        }
      }

      let activeLogin = currentLogin;

      if (loginChanged) {
        if (isStudent) {
          await studentsApi.updateLogin(currentLogin, trimmedLogin);
        } else {
          await teachersApi.updateLogin(currentLogin, trimmedLogin);
        }
        activeLogin = trimmedLogin;
      }

      if (isStudent) {
        const healthId = Number(form.healthGroupId);
        if (
          form.healthGroupId &&
          !Number.isNaN(healthId) &&
          healthId !== profile.healthGroup
        ) {
          await studentsApi.updateHealthGroup(activeLogin, healthId);
        }

      }

      const refreshed = isStudent
        ? await studentsApi.getStudentByLogin(activeLogin)
        : await teachersApi.findByLogin(activeLogin);

      setProfile(refreshed);
      setForm({
        lastName: refreshed?.lastName ?? '',
        firstName: refreshed?.firstName ?? '',
        patronymic: refreshed?.patronymic ?? '',
        login: refreshed?.login ?? activeLogin,
        healthGroupId: refreshed?.healthGroup != null ? String(refreshed.healthGroup) : '',
      });
      if (isStudent) {
        const sections = await getEnrolledSectionsForStudent(activeLogin).catch(() => []);
        setEnrolledSections(sections);
      }
      setSuccess('Изменения сохранены');
      onProfileUpdated?.(refreshed);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message;
      setError(msg || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile ? formatPersonName(profile) : formatPersonName(form);

  return (
    <div className="profile-page-panel add-user-panel">
      <div className="profile-page-header">
        <div>
          <button
            type="button"
            className="profile-back-btn"
            onClick={() => navigate(backTo)}
          >
            ← В кабинет
          </button>
          <h2 className="profile-page-title">{loading ? 'Профиль' : displayName || 'Профиль'}</h2>
          <p className="profile-page-subtitle">
            {isStudent ? 'Личный кабинет студента' : 'Личный кабинет преподавателя'}
          </p>
          <span className={`profile-role-badge profile-role-badge--${role}`}>
            {isStudent ? 'СТУДЕНТ' : 'ПРЕПОДАВАТЕЛЬ'}
          </span>
        </div>
      </div>

      <div className="profile-page-body">
        {error ? (
          <div className="form-alert form-alert--error" role="alert">
            <span className="form-alert-text">{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="form-alert form-alert--success" role="status">
            <span className="form-alert-text">{success}</span>
          </div>
        ) : null}

        {loading ? (
          <p className="profile-page-loading">Загрузка профиля…</p>
        ) : profile ? (
          <>
            <div className="profile-details">
              <div className="profile-detail">
                <span className="profile-detail-label">ID</span>
                <span className="profile-detail-value">{profile.id ?? '—'}</span>
              </div>
              <div className="profile-detail">
                <span className="profile-detail-label">Логин</span>
                <span className="profile-detail-value mono">{profile.login}</span>
              </div>
              {isStudent ? (
                <>
                  <div className="profile-detail">
                    <span className="profile-detail-label">Учебная группа</span>
                    <span className="profile-detail-value">{profile.groupName || '—'}</span>
                  </div>
                  <div className="profile-detail">
                    <span className="profile-detail-label">Мед. группа</span>
                    <span className="profile-detail-value">
                      {formatHealthGroupValue(profile.healthGroup, healthGroups)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-detail">
                    <span className="profile-detail-label">Модератор</span>
                    <span className="profile-detail-value">
                      {profile.moderator ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="profile-detail">
                    <span className="profile-detail-label">Занятий в расписании</span>
                    <span className="profile-detail-value">
                      {profile.schedule && typeof profile.schedule === 'object'
                        ? Object.keys(profile.schedule).length
                        : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {isStudent ? (
              <div className="profile-detail profile-detail--wide profile-sections-block">
                <span className="profile-detail-label">Спортивные секции</span>
                <EnrolledSectionsList sections={enrolledSections} loading={loading} />
              </div>
            ) : null}

            {isStudent && (attendancePercent != null || existStats.total > 0) ? (
              <div className="profile-stats-row">
                <div className="profile-stat-mini">
                  <strong>
                    {attendancePercent ?? computeAttendanceFromExist(profile.exist)}%
                  </strong>
                  <span>ПОСЕЩАЕМОСТЬ</span>
                </div>
                <div className="profile-stat-mini">
                  <strong>{totalAbsences ?? '—'}</strong>
                  <span>ПРОПУСКОВ</span>
                </div>
                <div className="profile-stat-mini">
                  <strong>
                    {existStats.present}/{existStats.total}
                  </strong>
                  <span>ОТМЕТОК В ЖУРНАЛЕ</span>
                </div>
              </div>
            ) : null}

            <h3 className="profile-section-title">Редактирование</h3>
            <form
              className="profile-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="form-row form-row--triple">
                <div className="form-group">
                  <label htmlFor="profile-lastName">Фамилия</label>
                  <input
                    id="profile-lastName"
                    className="form-input"
                    value={form.lastName}
                    onChange={handleFieldChange('lastName')}
                    disabled={saving}
                    autoComplete="family-name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-firstName">Имя</label>
                  <input
                    id="profile-firstName"
                    className="form-input"
                    value={form.firstName}
                    onChange={handleFieldChange('firstName')}
                    disabled={saving}
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-patronymic">Отчество</label>
                  <input
                    id="profile-patronymic"
                    className="form-input"
                    value={form.patronymic}
                    onChange={handleFieldChange('patronymic')}
                    disabled={saving}
                    autoComplete="additional-name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profile-login">Логин</label>
                  <input
                    id="profile-login"
                    className="form-input mono"
                    value={form.login}
                    onChange={handleFieldChange('login')}
                    disabled={saving}
                    autoComplete="username"
                  />
                  <p className="form-hint">После смены логина используйте новый при входе</p>
                </div>
              </div>

              {isStudent ? (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="profile-healthGroup">Медицинская группа</label>
                    <select
                      id="profile-healthGroup"
                      className="form-input"
                      value={form.healthGroupId}
                      onChange={handleFieldChange('healthGroupId')}
                      disabled={saving || healthGroups.length === 0}
                    >
                      <option value="">— не выбрана —</option>
                      {healthGroups.map((hg) => (
                        <option key={hg.id} value={hg.id}>
                          {formatHealthGroupValue(hg.id, healthGroups)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              <div className="profile-form-actions">
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  disabled={saving}
                  onClick={() => navigate(backTo)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </>
        ) : (
          <p className="profile-page-loading">Профиль недоступен</p>
        )}
      </div>
    </div>
  );
};
