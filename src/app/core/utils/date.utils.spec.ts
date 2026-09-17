import { toDateOnlyString, toDateTimeString, toDateValue } from './date.utils';

describe('date utilities', () => {
  it('preserves date-only values and formats Date instances', () => {
    expect(toDateOnlyString('2026-09-17')).toBe('2026-09-17');
    expect(toDateOnlyString(new Date(2026, 0, 2))).toBe('2026-01-02');
  });

  it('converts values to ISO date-time strings', () => {
    expect(toDateTimeString('2026-09-17T10:15:00Z')).toBe('2026-09-17T10:15:00.000Z');
  });

  it('returns empty or null values for missing input', () => {
    expect(toDateOnlyString(null)).toBe('');
    expect(toDateTimeString(undefined)).toBe('');
    expect(toDateValue(null)).toBeNull();
  });

  it('creates a local-midnight Date for a date-only value', () => {
    const value = toDateValue('2026-09-17');
    expect(value?.getFullYear()).toBe(2026);
    expect(value?.getMonth()).toBe(8);
    expect(value?.getDate()).toBe(17);
    expect(value?.getHours()).toBe(0);
  });
});
