// Spaced repetition with a small, deterministic SM-2 variant.
// Everything stays on the device: the caller stores the returned card state
// inside each summary's progress.cards map.

export const DAY_MS = 86400000;
export const REVIEW_RATINGS = Object.freeze(['again', 'hard', 'good', 'easy']);

const MIN_EASE = 1.3;
const MAX_EASE = 3.5;
const MAX_INTERVAL = 365;
const MAX_CARDS = 2000;

const asDate = (value) => (value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date());
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round2 = (value) => Math.round(value * 100) / 100;
const int = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
};

export function startOfLocalDay(value = new Date()) {
  const date = asDate(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isoDay(value = new Date()) {
  const date = startOfLocalDay(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value, days) {
  const date = startOfLocalDay(value);
  date.setDate(date.getDate() + days);
  return isoDay(date);
}

// Stable key for a generated card. The text, not the position, decides the
// identity so cards survive edits elsewhere in the summary.
export function cardKey(card) {
  const input = `${card?.kind || ''}\u0000${card?.front || ''}\u0000${card?.back || ''}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `c${hash.toString(36)}`;
}

export function newCardState() {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: null, last: null, rating: null };
}

export function normalizeCardState(value) {
  if (!value || typeof value !== 'object') return newCardState();
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(value.due || '')) ? String(value.due) : null;
  const last = /^\d{4}-\d{2}-\d{2}$/.test(String(value.last || '')) ? String(value.last) : null;
  return {
    ease: round2(clamp(Number(value.ease) || 2.5, MIN_EASE, MAX_EASE)),
    interval: clamp(int(value.interval), 0, MAX_INTERVAL),
    reps: clamp(int(value.reps), 0, 10000),
    lapses: clamp(int(value.lapses), 0, 10000),
    due,
    last,
    rating: REVIEW_RATINGS.includes(value.rating) ? value.rating : null,
  };
}

export function normalizeReviewCards(value) {
  if (!value || typeof value !== 'object') return {};
  const cards = {};
  for (const [key, state] of Object.entries(value)) {
    const cleanKey = String(key || '').slice(0, 24);
    if (!/^c[a-z0-9]+$/.test(cleanKey)) continue;
    cards[cleanKey] = normalizeCardState(state);
    if (Object.keys(cards).length >= MAX_CARDS) break;
  }
  return cards;
}

export function previewIntervals(state, now = new Date()) {
  const base = normalizeCardState(state);
  const intervals = {};
  for (const rating of REVIEW_RATINGS) {
    intervals[rating] = scheduleCard(base, rating, now).interval;
  }
  return intervals;
}

export function scheduleCard(state, rating, now = new Date()) {
  const card = normalizeCardState(state);
  if (!REVIEW_RATINGS.includes(rating)) return card;
  const today = isoDay(now);
  let ease = card.ease;
  let interval = card.interval;
  let reps = card.reps;
  let lapses = card.lapses;

  if (rating === 'again') {
    reps = 0;
    lapses += 1;
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    interval = 1;
  } else if (rating === 'hard') {
    reps += 1;
    ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
    interval = Math.max(1, Math.round(interval * 1.2));
  } else if (rating === 'good') {
    reps += 1;
    interval = interval <= 0 ? 1 : reps <= 2 ? (reps === 1 ? 1 : 3) : Math.round(interval * ease);
  } else {
    reps += 1;
    ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
    interval = interval <= 0 ? 3 : reps === 1 ? 3 : Math.max(4, Math.round(interval * ease * 1.3));
  }

  interval = clamp(interval, 1, MAX_INTERVAL);
  return {
    ease: round2(ease),
    interval,
    reps,
    lapses,
    due: addDays(now, interval),
    last: today,
    rating,
  };
}

export function cardStatus(state, hasState, now = new Date()) {
  if (!hasState) return 'new';
  const clean = normalizeCardState(state);
  if (!clean.due) return 'due';
  return clean.due <= isoDay(now) ? 'due' : 'scheduled';
}

// Applies one rating to a record's progress object and returns a new object.
// The caller owns persistence; nothing here touches storage.
export function applyReview(progress, key, rating, now = new Date()) {
  const next = { ...(progress && typeof progress === 'object' ? progress : {}) };
  const cards = { ...normalizeReviewCards(next.cards) };
  cards[key] = scheduleCard(cards[key], rating, now);
  next.cards = cards;
  next.studied = true;
  return next;
}

// entries: [{ record, analysis }]; analysis.cards comes from analyzeSummary.
export function buildReviewQueue(entries, { now = new Date(), subject = 'all', limit = 20 } = {}) {
  const today = isoDay(now);
  const due = [];
  const fresh = [];
  const bySubject = {};
  const records = [];
  let totalCards = 0;
  let dueCount = 0;
  let newCount = 0;
  let scheduledCount = 0;
  let learned = 0;
  let nextDue = null;

  for (const entry of Array.isArray(entries) ? entries : []) {
    const record = entry?.record;
    const cards = Array.isArray(entry?.analysis?.cards) ? entry.analysis.cards : [];
    if (!record?.id || !cards.length) continue;
    if (subject !== 'all' && record.subject !== subject) continue;
    const states = normalizeReviewCards(record.progress?.cards);
    const recordEntry = { id: record.id, title: record.title || '', subject: record.subject || 'general', due: 0, new: 0, total: 0 };
    for (const [index, card] of cards.entries()) {
      if (!card?.front || !card?.back) continue;
      const key = cardKey(card);
      const hasState = Object.prototype.hasOwnProperty.call(states, key);
      const state = hasState ? states[key] : newCardState();
      const status = cardStatus(state, hasState, now);
      if (status === 'scheduled') {
        scheduledCount += 1;
        if (!nextDue || state.due < nextDue) nextDue = state.due;
      }
      if (hasState && state.reps > 0) learned += 1;
      totalCards += 1;
      recordEntry.total += 1;
      const bucket = bySubject[record.subject] || { subject: record.subject, total: 0, due: 0, new: 0 };
      bucket.total += 1;
      if (status === 'due') {
        bucket.due += 1;
        dueCount += 1;
        recordEntry.due += 1;
        due.push({
          id: `${record.id}:${key}`,
          key,
          recordId: record.id,
          recordTitle: record.title || '',
          subject: record.subject || 'general',
          index,
          card,
          state,
          status,
          due: state.due || today,
        });
      } else if (status === 'new') {
        bucket.new += 1;
        newCount += 1;
        recordEntry.new += 1;
        fresh.push({
          id: `${record.id}:${key}`,
          key,
          recordId: record.id,
          recordTitle: record.title || '',
          subject: record.subject || 'general',
          index,
          card,
          state,
          status,
          due: null,
        });
      }
      bySubject[record.subject] = bucket;
    }
    if (recordEntry.due || recordEntry.new) records.push(recordEntry);
  }

  due.sort((a, b) => (a.due || '').localeCompare(b.due || '') || a.recordTitle.localeCompare(b.recordTitle) || a.index - b.index);
  fresh.sort((a, b) => a.recordTitle.localeCompare(b.recordTitle) || a.index - b.index);
  const size = Math.max(1, Math.min(100, int(limit, 20)));
  const items = [...due, ...fresh].slice(0, size).map((item) => ({ ...item, intervals: previewIntervals(item.state, now) }));

  return {
    items,
    dueCount,
    newCount,
    scheduledCount,
    totalCards,
    learned,
    nextDue,
    bySubject: Object.values(bySubject).sort((a, b) => (b.due + b.new) - (a.due + a.new) || a.subject.localeCompare(b.subject)),
    records: records.sort((a, b) => (b.due + b.new) - (a.due + a.new) || a.title.localeCompare(b.title)),
  };
}
