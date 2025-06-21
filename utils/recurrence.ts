// utils/recurrence.ts
import { RRule, Options as RRuleOptions } from "rrule";

/** Return de volgende `count` datums na `start` volgens de opts */
export function getNextOccurrences(
  start: Date,
  opts: RRuleOptions,
  count = 5
): Date[] {
  const rule = new RRule({ dtstart: start, ...opts });
  return rule.all((date, i) => i < count);
}
