import { getCurrentDateTime } from '../../src/utils/getCurrentDateTime.js';

describe('getCurrentDateTime', () => {
  describe('Formato', () => {
    test('Debe retornar ISO 8601 string', () => {
      const result = getCurrentDateTime();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('Debe contener timezone (Z)', () => {
      const result = getCurrentDateTime();
      expect(result).toMatch(/Z$/);
    });
  });

  describe('Validez', () => {
    test('Debe retornar fecha válida', () => {
      const result = getCurrentDateTime();
      const date = new Date(result);
      expect(date instanceof Date).toBe(true);
      expect(isNaN(date.getTime())).toBe(false);
    });

    test('Debe retornar fecha cercana a ahora', () => {
      const before = Date.now();
      const result = getCurrentDateTime();
      const after = Date.now();
      const timestamp = new Date(result).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after + 100);
    });

    test('Debe ser consistente en llamadas cercanas', () => {
      const dt1 = getCurrentDateTime();
      const dt2 = getCurrentDateTime();
      const diff = Math.abs(new Date(dt2).getTime() - new Date(dt1).getTime());
      expect(diff).toBeLessThan(100);
    });
  });
});
