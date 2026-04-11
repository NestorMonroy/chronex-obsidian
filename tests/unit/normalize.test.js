/**
 * Tests para helpers/normalize.js
 * FASE 3: Helper para normalización de texto
 * 
 * @file normalize.test.js
 * @version 1.0.0
 */

import { normalizeText } from '../../src/utils/helpers/normalize.js';

describe('normalizeText', () => {
  
  describe('Conversión a minúsculas', () => {
    test('Debe convertir a minúsculas', () => {
      expect(normalizeText('HOLA MUNDO')).toBe('hola mundo');
    });

    test('Debe manejar texto mixto', () => {
      expect(normalizeText('HoLa MuNdO')).toBe('hola mundo');
    });
  });

  describe('Remoción de acentos', () => {
    test('Debe remover acentos agudos', () => {
      expect(normalizeText('Programación')).toBe('programacion');
    });

    test('Debe remover acentos graves', () => {
      expect(normalizeText('Último')).toBe('ultimo');
    });

    test('Debe remover diéresis', () => {
      expect(normalizeText('Lingüística')).toBe('linguistica');
    });

    test('Debe manejar caracteres españoles especiales', () => {
      expect(normalizeText('Niño Español')).toBe('nino espanol');
    });
  });

  describe('Remoción de caracteres especiales', () => {
    test('Debe mantener alfanuméricos y espacios', () => {
      expect(normalizeText('Proyecto 2025')).toBe('proyecto 2025');
    });

    test('Debe remover puntuación', () => {
      expect(normalizeText('Hola, mundo!')).toBe('hola mundo');
    });

    test('Debe remover símbolos especiales', () => {
      expect(normalizeText('Mi @#$ Proyecto')).toBe('mi proyecto');
    });

    test('Debe manejar múltiples caracteres especiales', () => {
      expect(normalizeText('Uno & Dos // Tres')).toBe('uno dos tres');
    });
  });

  describe('Opciones personalizadas', () => {
    test('Debe permitir deshabilitar normalización de acentos', () => {
      const result = normalizeText('Programación', { removeAccents: false });
      expect(result).toMatch(/programación/);
    });

    test('Debe permitir caracteres personalizados', () => {
      const result = normalizeText('a-b_c', { keepChars: '-_' });
      expect(result).toBe('a-b_c');
    });
  });

  describe('Edge cases', () => {
    test('Debe manejar cadena vacía', () => {
      expect(normalizeText('')).toBe('');
    });

    test('Debe manejar solo espacios', () => {
      expect(normalizeText('   ')).toBe('');
    });

    test('Debe condensar espacios múltiples', () => {
      expect(normalizeText('Hola    mundo')).toBe('hola mundo');
    });
  });
});
