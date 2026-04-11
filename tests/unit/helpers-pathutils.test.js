import * as pathUtils from '../../src/utils/helpers/pathUtils.js';

describe('pathUtils helpers', () => {
  describe('normalizePath', () => {
    test('Debe convertir backslash a forward slash', () => {
      expect(pathUtils.normalizePath('docs\\spec\\file')).toBe('docs/spec/file');
    });
    test('Debe condensar slashes múltiples', () => {
      expect(pathUtils.normalizePath('docs//spec///file')).toBe('docs/spec/file');
    });
  });

  describe('splitPath', () => {
    test('Debe dividir ruta en partes', () => {
      expect(pathUtils.splitPath('docs/spec/file')).toEqual(['docs', 'spec', 'file']);
    });
    test('Debe ignorar partes vacías', () => {
      expect(pathUtils.splitPath('docs//spec')).toEqual(['docs', 'spec']);
    });
  });

  describe('joinPath', () => {
    test('Debe unir partes de ruta', () => {
      expect(pathUtils.joinPath('docs', 'spec', 'file')).toBe('docs/spec/file');
    });
    test('Debe ignorar partes vacías', () => {
      expect(pathUtils.joinPath('docs', '', 'spec')).toBe('docs/spec');
    });
  });

  describe('getParentFolder', () => {
    test('Debe obtener carpeta padre', () => {
      expect(pathUtils.getParentFolder('docs/spec/file.md')).toBe('docs/spec');
    });
    test('Debe retornar . para rutas cortas', () => {
      expect(pathUtils.getParentFolder('file.md')).toBe('.');
    });
  });

  describe('getFileName', () => {
    test('Debe extraer nombre de archivo', () => {
      expect(pathUtils.getFileName('docs/spec/file.md')).toBe('file.md');
    });
    test('Debe manejar rutas sin subcarpetas', () => {
      expect(pathUtils.getFileName('file.md')).toBe('file.md');
    });
  });

  describe('getExtension', () => {
    test('Debe extraer extensión', () => {
      expect(pathUtils.getExtension('docs/file.md')).toBe('.md');
    });
    test('Debe retornar vacío sin extensión', () => {
      expect(pathUtils.getExtension('docs/README')).toBe('');
    });
  });
});
