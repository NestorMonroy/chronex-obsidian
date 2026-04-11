import { getAuthorName } from '../../src/utils/getAuthorName.js';

describe('getAuthorName', () => {
  test('Debe retornar nombre de autor', () => {
    const author = getAuthorName();
    expect(typeof author).toBe('string');
    expect(author.length).toBeGreaterThan(0);
  });

  test('Debe retornar un nombre válido', () => {
    const author = getAuthorName();
    expect(author).toMatch(/^[a-zA-Z\s]+$/);
  });

  test('Debe ser consistente', () => {
    const author1 = getAuthorName();
    const author2 = getAuthorName();
    expect(author1).toBe(author2);
  });

  test('Debe aceptar opciones personalizadas', () => {
    const customAuthor = getAuthorName({ name: 'Claude' });
    expect(customAuthor).toBe('Claude');
  });

  test('Debe retornar nombre default si no hay opciones', () => {
    const author = getAuthorName();
    expect(author).toBeDefined();
  });

  test('Debe responder a cambios de opciones', () => {
    const author1 = getAuthorName();
    const author2 = getAuthorName({ name: 'OtherAuthor' });
    expect(author1).not.toBe(author2);
  });
});
