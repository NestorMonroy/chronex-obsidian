/**
 * Módulo: Obtener metadata de frontmatter
 * Extrae metadata YAML del frontmatter de un documento
 * 
 * @module src/utils/getMetadataByFrontmatter
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Extrae metadata del frontmatter YAML de un documento
 *
 * @param {string} content - Contenido del archivo (con frontmatter)
 * @param {Object} options - Opciones de parseo
 * @param {string} options.delimiter - Delimitador de frontmatter (default: '---')
 *
 * @returns {Promise<Object>} Objeto con metadata extraída
 *
 * @example
 * const content = `---
 * id: 123
 * name: Mi Proyecto
 * ---
 * Contenido`;
 *
 * const metadata = await getMetadataByFrontmatter(content);
 * // { id: '123', name: 'Mi Proyecto' }
 *
 * @todo Implementar YAML parsing real con librería en FASE 3
 */
export async function getMetadataByFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!match) {
    return {};
  }
  
  const metadata = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    if (!line.includes(':')) continue;
    const [key, ...valueParts] = line.split(':');
    const cleanKey = key.trim();
    const cleanValue = valueParts.join(':').trim();
    metadata[cleanKey] = cleanValue || null;
  }
  
  return metadata;
}
