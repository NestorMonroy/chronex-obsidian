/**
 * Módulo: Obtener nombre de archivo
 * @module src/utils/getFileName
 * @version 1.0.0
 * @todo Implementar en FASE 2
 */
export function getFileName(title) {
  // TODO: FASE 2 - Limpiar caracteres, kebab-case, añadir .md
  return title.toLowerCase().replace(/\s+/g, '-') + '.md';
}
