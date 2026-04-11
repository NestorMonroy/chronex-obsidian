/**
 * Módulo: Obtener nombre del autor
 * Retorna el nombre del autor actual del sistema
 * 
 * @module src/utils/getAuthorName
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Obtiene el nombre del autor
 *
 * @param {Object} options - Opciones de autor
 * @param {string} options.name - Nombre personalizado del autor
 *
 * @returns {string} Nombre del autor (default: 'Nestor')
 *
 * @example
 * const author = getAuthorName();
 * // 'Nestor'
 *
 * const custom = getAuthorName({ name: 'Claude' });
 * // 'Claude'
 *
 * @todo Leer desde configuración Obsidian en FASE 3
 */
export function getAuthorName(options = {}) {
  return options.name ?? 'Nestor';
}
