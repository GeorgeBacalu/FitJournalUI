import { countByDay, countGoalStatuses, withinDays } from './dashboard-analytics.utils';
import { describe, expect, it } from 'vitest';

describe('dashboard analytics', () => {
  it('filters entries by the selected rolling period', () => {
    const now = new Date('2026-08-29T12:00:00Z').getTime();
    const entries = [{ date: '2026-08-20' }, { date: '2026-05-01' }];
    expect(withinDays(entries, (x) => x.date, 30, now)).toEqual([entries[0]]);
    expect(withinDays(entries, (x) => x.date, 0, now)).toHaveLength(2);
  });

  it('groups activity counts chronologically by day', () => {
    const result = countByDay([{ date: '2026-08-29T10:00:00Z' }, { date: '2026-08-28T10:00:00Z' }, { date: '2026-08-29T18:00:00Z' }], (x) => x.date);
    expect(result).toEqual({ labels: ['2026-08-28', '2026-08-29'], values: [1, 2] });
  });

  it('summarizes active and achieved goals', () => {
    const result = countGoalStatuses(
      [{ isAchieved: false }, { isAchieved: true }, { isAchieved: false }],
      (goal) => goal.isAchieved
    );

    expect(result).toEqual({ active: 2, achieved: 1 });
  });
});
