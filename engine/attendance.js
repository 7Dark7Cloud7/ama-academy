export const ATTENDANCE_STATUSES = ['present', 'late', 'absent'];
export const ATTENDANCE_MAX_ROSTER = 100;
export const ATTENDANCE_MAX_SESSIONS = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_SET = new Set(ATTENDANCE_STATUSES);

function clean(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeId(value) {
  const id = String(value ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 24);
  return id || `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeAttendanceRoster(value) {
  const items = Array.isArray(value) ? value : String(value ?? '').split(/[\n,;]+/);
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const name = clean(item && typeof item === 'object' ? item.name : item, 70);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= ATTENDANCE_MAX_ROSTER) break;
  }
  return out;
}

export function normalizeAttendanceEntry(value) {
  const name = clean(value?.name, 70);
  if (!name) return null;
  return { name, status: STATUS_SET.has(value?.status) ? value.status : 'present' };
}

export function normalizeAttendanceSession(value) {
  if (!value || typeof value !== 'object') return null;
  const date = DATE_PATTERN.test(String(value.date || '')) ? String(value.date) : new Date().toISOString().slice(0, 10);
  const label = clean(value.label, 60) || 'Aula';
  const seen = new Set();
  const entries = [];
  for (const item of Array.isArray(value.entries) ? value.entries : []) {
    const entry = normalizeAttendanceEntry(item);
    if (!entry) continue;
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
  }
  if (!entries.length) return null;
  const createdAt = Number.isNaN(Date.parse(value.createdAt)) ? new Date().toISOString() : new Date(value.createdAt).toISOString();
  return { id: safeId(value.id), date, label, entries, createdAt };
}

export function normalizeAttendanceSessions(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const sessions = [];
  for (const item of value) {
    const session = normalizeAttendanceSession(item);
    if (!session || seen.has(session.id)) continue;
    seen.add(session.id);
    sessions.push(session);
    if (sessions.length >= ATTENDANCE_MAX_SESSIONS) break;
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function attendanceCounts(entries) {
  const counts = { present: 0, late: 0, absent: 0, total: 0, attended: 0, rate: 0 };
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!STATUS_SET.has(entry?.status)) continue;
    counts[entry.status] += 1;
    counts.total += 1;
  }
  counts.attended = counts.present + counts.late;
  counts.rate = counts.total ? Math.round((counts.attended / counts.total) * 100) : 0;
  return counts;
}

export function attendanceSummary(sessions) {
  const summary = { sessions: 0, marks: 0, present: 0, late: 0, absent: 0, attended: 0, rate: 0 };
  for (const session of Array.isArray(sessions) ? sessions : []) {
    const counts = attendanceCounts(session?.entries);
    if (!counts.total) continue;
    summary.sessions += 1;
    summary.marks += counts.total;
    summary.present += counts.present;
    summary.late += counts.late;
    summary.absent += counts.absent;
    summary.attended += counts.attended;
  }
  summary.rate = summary.marks ? Math.round((summary.attended / summary.marks) * 100) : 0;
  return summary;
}

export function upsertAttendanceSession(sessions, value) {
  const session = normalizeAttendanceSession(value);
  if (!session) return normalizeAttendanceSessions(sessions);
  const list = normalizeAttendanceSessions(sessions);
  const label = session.label.toLowerCase();
  const existing = list.findIndex((item) => item.date === session.date && item.label.toLowerCase() === label);
  if (existing >= 0) {
    list[existing] = { ...session, id: list[existing].id };
  } else {
    list.push(session);
  }
  return normalizeAttendanceSessions(list);
}

export function attendanceCsv(sessions, { lang = 'pt' } = {}) {
  const isPt = lang !== 'en';
  const status = isPt
    ? { present: 'Presente', late: 'Atrasado', absent: 'Ausente' }
    : { present: 'Present', late: 'Late', absent: 'Absent' };
  const header = isPt
    ? ['Data', 'Aula', 'Aluno', 'Estado']
    : ['Date', 'Session', 'Student', 'Status'];
  const escape = (value) => {
    const text = String(value ?? '');
    // A leading =, +, - or @ makes spreadsheet apps treat the cell as a formula.
    const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${guarded.replace(/"/g, '""')}"`;
  };
  const lines = [header.map(escape).join(',')];
  for (const session of normalizeAttendanceSessions(sessions)) {
    for (const entry of session.entries) {
      lines.push([session.date, session.label, entry.name, status[entry.status]].map(escape).join(','));
    }
  }
  return lines.join('\r\n');
}
