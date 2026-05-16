export { visitsApi } from './api/visitsApi';
export {
  computePercentFromAttendanceMap,
  computeAbsencesFromAttendanceMap,
} from './lib/computeAttendanceStatsFromMap';
export {
  computePercentFromAttendanceMapByDay,
  computePercentFromAttendanceMapBySlot,
  computeAbsencesFromAttendanceMapByDay,
  computeAbsencesFromAttendanceMapBySlot,
  computeAttendancePercentUnified,
} from '/shared/lib/attendance/computeAttendancePercent';
