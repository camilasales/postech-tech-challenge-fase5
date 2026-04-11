import { describe, expect, it } from 'vitest';
import { buildActivityDescription, parseActivityDescription } from './activityDescription';

describe('activityDescription', () => {
  it('builds title-only description', () => {
    expect(buildActivityDescription('Consulta medica', '')).toBe('Consulta medica');
  });

  it('builds multiline description when notes exist', () => {
    expect(buildActivityDescription('Consulta medica', 'Levar exames')).toBe(
      'Consulta medica\nLevar exames'
    );
  });

  it('parses a single-line description', () => {
    expect(parseActivityDescription('Pagar conta')).toEqual({
      title: 'Pagar conta',
      subtitle: null,
    });
  });

  it('parses title and subtitle from multiline text', () => {
    expect(parseActivityDescription('Consulta\nLevar exames')).toEqual({
      title: 'Consulta',
      subtitle: 'Levar exames',
    });
  });
});
