import { getMetadataByFrontmatter } from '../../src/utils/getMetadataByFrontmatter.js';

describe('getMetadataByFrontmatter', () => {
  const validFrontmatter = `---
id: 123
name: Mi Proyecto
type: repository
---
Contenido`;

  test('Debe extraer metadata válida', async () => {
    const metadata = await getMetadataByFrontmatter(validFrontmatter);
    expect(metadata).toBeDefined();
    expect(metadata.id).toBe('123');
  });

  test('Debe retornar objeto con propiedades', async () => {
    const metadata = await getMetadataByFrontmatter(validFrontmatter);
    expect(typeof metadata).toBe('object');
    expect(Object.keys(metadata).length).toBeGreaterThan(0);
  });

  test('Debe manejar frontmatter vacío', async () => {
    const empty = '---\n---\n';
    const metadata = await getMetadataByFrontmatter(empty);
    expect(metadata).toBeDefined();
  });

  test('Debe manejar contenido sin frontmatter', async () => {
    const noFrontmatter = 'Solo contenido sin frontmatter';
    const metadata = await getMetadataByFrontmatter(noFrontmatter);
    expect(metadata).toBeDefined();
  });

  test('Debe extraer múltiples campos', async () => {
    const metadata = await getMetadataByFrontmatter(validFrontmatter);
    expect(metadata.id).toBeDefined();
    expect(metadata.name).toBeDefined();
    expect(metadata.type).toBeDefined();
  });

  test('Debe retornar null para campos faltantes', async () => {
    const metadata = await getMetadataByFrontmatter(validFrontmatter);
    expect(metadata.nonexistent === null || metadata.nonexistent === undefined).toBe(true);
  });

  test('Debe ser función async', () => {
    const result = getMetadataByFrontmatter(validFrontmatter);
    expect(result).toBeInstanceOf(Promise);
  });

  test('Debe manejar caracteres especiales', async () => {
    const special = `---
name: Proyecto @#$
description: Test
---`;
    const metadata = await getMetadataByFrontmatter(special);
    expect(metadata.name).toBeDefined();
  });

  test('Debe manejar valores con espacios', async () => {
    const fm = `---
author: Juan Pérez García
---`;
    const metadata = await getMetadataByFrontmatter(fm);
    expect(metadata.author).toBe('Juan Pérez García');
  });

  test('Debe manejar valores numéricos', async () => {
    const fm = `---
version: 1.0
priority: 5
---`;
    const metadata = await getMetadataByFrontmatter(fm);
    expect(metadata.version).toBeDefined();
  });
});
