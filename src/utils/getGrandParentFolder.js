/**
 * Módulo: Obtener carpeta ancestro
 * Obtiene la carpeta ancestro (2 niveles arriba) de una ruta
 * 
 * @module src/utils/getGrandParentFolder
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Obtiene la carpeta ancestro (grandparent) de una ruta de archivo
 *
 * @param {string} filePath - Ruta del archivo (ej: docs/spec/file.md)
 * @param {Object} options - Opciones de navegación
 * @param {string} options.separator - Separador de ruta (default: '/')
 *
 * @returns {string} Ruta de la carpeta ancestro (ej: docs)
 *
 * @example
 * getGrandParentFolder('docs/specification/index.md')
 * // 'docs'
 *
 * getGrandParentFolder('a/b/c/d/file.md')
 * // 'a/b/c'
 *
 * getGrandParentFolder('file.md')
 * // '.'
 *
 * @todo Mejorar manejo de rutas con UNC en FASE 3
 */
export function getGrandParentFolder(filePath, options = {}) {
  const separator = options.separator ?? '/';
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(p => p.length > 0);
  
  if (parts.length <= 2) {
    return '.';
  }
  
  return parts.slice(0, -2).join('/');
}
