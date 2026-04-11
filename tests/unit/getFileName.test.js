import { getFileName } from '../../src/utils/getFileName.js';

describe('getFileName', () => {
  describe('Formato', () => {
    test('Debe convertir a minúsculas', () => {
      const result = getFileName('Mi Proyecto');
      expect(result).toBe(result.toLowerCase());
    });

    test('Debe reemplazar espacios con guiones', () => {
      const result = getFileName('Mi Proyecto Grande');
      expect(result).toMatch(/^[a-z0-9\-]+\.md$/);
      expect(result).not.toMatch(/ /);
    });

    test('Debe terminar con .md', () => {
      const result = getFileName('Proyecto');
      expect(result).toMatch(/\.md$/);
    });
  });

  describe('Caracteres especiales', () => {
    test('Debe remover caracteres especiales', () => {
      const result = getFileName('Mi @#$ Proyecto');
      expect(result).toMatch(/^[a-z0-9\-\.]+$/);
    });

    test('Debe manejar acentos', () => {
      const result = getFileName('Programación');
      expect(result).toMatch(/^[a-z0-9\-\.]+$/);
    });
  });

  describe('Edge cases', () => {
    test('Debe manejar cadena vacía', () => {
      const result = getFileName('');
      expect(result).toBe('archivo.md');
    });

    test('Debe manejar solo espacios', () => {
      const result = getFileName('   ');
      expect(result).toBe('archivo.md');
    });

    test('Debe manejar nombres cortos', () => {
      const result = getFileName('a');
      expect(result).toBe('a.md');
    });
  });
});
