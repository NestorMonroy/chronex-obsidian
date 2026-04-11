import * as validators from '../../src/utils/helpers/validators.js';

describe('validators helpers', () => {
  describe('isNullOrUndefined', () => {
    test('Debe detectar null', () => {
      expect(validators.isNullOrUndefined(null)).toBe(true);
    });
    test('Debe detectar undefined', () => {
      expect(validators.isNullOrUndefined(undefined)).toBe(true);
    });
    test('Debe rechazar otros valores', () => {
      expect(validators.isNullOrUndefined('')).toBe(false);
      expect(validators.isNullOrUndefined(0)).toBe(false);
    });
  });

  describe('isString', () => {
    test('Debe aceptar string', () => {
      expect(validators.isString('hola')).toBe(true);
    });
    test('Debe rechazar no-string', () => {
      expect(validators.isString(123)).toBe(false);
      expect(validators.isString(null)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('Debe detectar string vacío', () => {
      expect(validators.isEmpty('')).toBe(true);
    });
    test('Debe detectar solo espacios', () => {
      expect(validators.isEmpty('   ')).toBe(true);
    });
    test('Debe rechazar string con contenido', () => {
      expect(validators.isEmpty('hola')).toBe(false);
    });
  });

  describe('isValidLength', () => {
    test('Debe validar longitud dentro de rango', () => {
      expect(validators.isValidLength('abc', 3, 5)).toBe(true);
    });
    test('Debe rechazar longitud fuera de rango', () => {
      expect(validators.isValidLength('ab', 3, 5)).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    test('Debe validar patrón regex', () => {
      expect(validators.matchesPattern('abc123', /^[a-z0-9]+$/)).toBe(true);
    });
    test('Debe rechazar patrón inválido', () => {
      expect(validators.matchesPattern('abc@123', /^[a-z0-9]+$/)).toBe(false);
    });
  });

  describe('isValidType', () => {
    test('Debe validar tipo string', () => {
      expect(validators.isValidType('hola', 'string')).toBe(true);
    });
    test('Debe validar tipo number', () => {
      expect(validators.isValidType(123, 'number')).toBe(true);
    });
    test('Debe rechazar tipo incorrecto', () => {
      expect(validators.isValidType('hola', 'number')).toBe(false);
    });
  });
});
