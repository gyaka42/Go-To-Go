// utils/recurrence.ts
import { Frequency, RRule, Options as RRuleOptions } from "rrule";

export function rruleWeekdayForDate(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Fill in values that the picker may omit, most importantly the weekday. */
export function normalizeRecurrence(
  recurrence: Partial<RRuleOptions> | undefined,
  start: Date | null
): Partial<RRuleOptions> | undefined {
  if (!recurrence) return undefined;

  const normalized: Partial<RRuleOptions> = {
    ...recurrence,
    interval: Math.max(1, Number(recurrence.interval) || 1),
  };

  if (normalized.freq === Frequency.WEEKLY && start) {
    const weekdays = Array.isArray(normalized.byweekday)
      ? normalized.byweekday
      : [];
    if (weekdays.length === 0) {
      normalized.byweekday = [rruleWeekdayForDate(start)];
    }
  }

  if (
    normalized.freq !== Frequency.WEEKLY &&
    Array.isArray(normalized.byweekday) &&
    normalized.byweekday.length === 0
  ) {
    delete normalized.byweekday;
  }

  return normalized;
}

export function getNextOccurrence(
  start: Date,
  recurrence: Partial<RRuleOptions>,
  after = new Date()
): Date | null {
  const normalized = normalizeRecurrence(recurrence, start);
  if (!normalized?.freq) return null;
  const rule = new RRule({ dtstart: start, ...normalized });
  return rule.after(after, false);
}

/** Return de volgende `count` datums na `start` volgens de opts */
export function getNextOccurrences(
  start: Date,
  opts: RRuleOptions,
  count = 5
): Date[] {
  const rule = new RRule({ dtstart: start, ...normalizeRecurrence(opts, start) });
  return rule.all((date, i) => i < count);
}
