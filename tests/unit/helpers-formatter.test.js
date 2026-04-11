import * as formatter from '../../src/utils/helpers/formatter.js';

describe('formatter helpers', () => {
  describe('formatType', () => {
    test('Debe convertir a minúsculas', () => {
      expect(formatter.formatType('SUCCESS')).toBe('success');
    });
    test('Debe retornar info por defecto', () => {
      expect(formatter.formatType(null)).toBe('info');
    });
  });

  describe('formatMessage', () => {
    test('Debe retornar mensaje limpio', () => {
      expect(formatter.formatMessage('  hola  ')).toBe('hola');
    });
    test('Debe retornar vacío para null', () => {
      expect(formatter.formatMessage(null)).toBe('');
    });
  });

  describe('formatDuration', () => {
    test('Debe retornar duración válida', () => {
      expect(formatter.formatDuration(5000)).toBe(5000);
    });
    test('Debe retornar 3000 por defecto', () => {
      expect(formatter.formatDuration(null)).toBe(3000);
    });
    test('Debe rechazar valores negativos', () => {
      expect(formatter.formatDuration(-1000)).toBe(0);
    });
  });

  describe('formatNotification', () => {
    test('Debe formatear notificación completa', () => {
      const result = formatter.formatNotification('Hola', 'SUCCESS', 5000);
      expect(result.message).toBe('Hola');
      expect(result.type).toBe('success');
      expect(result.duration).toBe(5000);
    });
    test('Debe usar valores por defecto', () => {
      const result = formatter.formatNotification('Test');
      expect(result.type).toBe('info');
      expect(result.duration).toBe(3000);
    });
  });
});
