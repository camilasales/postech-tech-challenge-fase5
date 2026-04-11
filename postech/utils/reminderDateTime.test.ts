import { describe, expect, it } from 'vitest';
import {
  combineDateTime,
  formatDateInput,
  formatTimeInput,
  parseDate,
  parseTime,
} from './reminderDateTime';

describe('reminderDateTime', () => {
  it('applies date mask', () => {
    expect(formatDateInput('12032026')).toBe('12/03/2026');
  });

  it('applies time mask', () => {
    expect(formatTimeInput('0930')).toBe('09:30');
  });

  it('parses a valid date', () => {
    const value = parseDate('12/03/2026');
    expect(value).not.toBeNull();
    expect(value?.getFullYear()).toBe(2026);
    expect(value?.getMonth()).toBe(2);
    expect(value?.getDate()).toBe(12);
  });

  it('rejects an invalid time', () => {
    expect(parseTime('25:90')).toBeNull();
  });

  it('combines date and time', () => {
    const value = combineDateTime('12/03/2026', '09:30');
    expect(value).not.toBeNull();
    expect(value?.getHours()).toBe(9);
    expect(value?.getMinutes()).toBe(30);
  });
});
