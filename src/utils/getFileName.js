/**
 * Módulo: Obtener nombre de archivo
 * Convierte títulos a nombres de archivo válidos (kebab-case)
 * 
 * @module src/utils/getFileName
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Convierte un título a nombre de archivo válido
 *
 * @param {string} title - Título del nota o proyecto
 * @param {Object} options - Opciones de conversión
 * @param {string} options.separator - Separador (default: '-')
 *
 * @returns {string} Nombre de archivo (kebab-case.md)
 *
 * @example
 * getFileName('Mi Proyecto') // 'mi-proyecto.md'
 * getFileName('Programación 2025') // 'programacion-2025.md'
 *
 * @todo Agregar soporte para caracteres acentuados en FASE 3
 */
export function getFileName(title, options = {}) {
  const separator = options.separator ?? '-';

  // Manejar cadena vacía o solo espacios
  if (!title || title.trim().length === 0) {
    return 'archivo.md';
  }

  // Normalizar: eliminar acentos y convertir a minúsculas
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remover caracteres especiales, mantener solo alfanuméricos y espacios
  const cleaned = normalized.replace(/[^a-z0-9\s]/g, '');

  // Reemplazar espacios con separador
  const fileName = cleaned.replace(/\s+/g, separator).replace(/^-+|-+$/g, '');

  // Retornar con extensión .md
  return (fileName || 'archivo') + '.md';
}
