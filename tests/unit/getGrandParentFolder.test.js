import { getGrandParentFolder } from '../../src/utils/getGrandParentFolder.js';

describe('getGrandParentFolder', () => {
  test('Debe retornar carpeta válida', () => {
    const folder = getGrandParentFolder('docs/specification/index.md');
    expect(typeof folder).toBe('string');
    expect(folder.length).toBeGreaterThan(0);
  });

  test('Debe obtener carpeta de nivel 2', () => {
    const folder = getGrandParentFolder('docs/specification/index.md');
    expect(folder).toBe('docs');
  });

  test('Debe manejar rutas simples', () => {
    const folder = getGrandParentFolder('index.md');
    expect(folder).toBe('.');
  });

  test('Debe manejar rutas profundas', () => {
    const folder = getGrandParentFolder('a/b/c/d/file.md');
    expect(folder).toBe('a/b/c');
  });

  test('Debe remover nombre de archivo', () => {
    const folder = getGrandParentFolder('docs/src/utils/index.js');
    expect(folder).not.toMatch(/\.js$/);
  });

  test('Debe trabajar con rutas relativas', () => {
    const folder = getGrandParentFolder('./docs/spec/file.md');
    expect(folder).toBeDefined();
  });

  test('Debe manejar rutas con múltiples separadores', () => {
    const folder = getGrandParentFolder('docs///spec///file.md');
    expect(folder).toBeDefined();
  });

  test('Debe aceptar opciones para separador personalizado', () => {
    const folder = getGrandParentFolder('docs\\src\\file.md', { separator: '\\' });
    expect(folder).toBeDefined();
  });
});
