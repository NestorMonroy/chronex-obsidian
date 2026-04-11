/**
 * Módulo: Obtener fecha/hora actual
 * Retorna timestamp ISO 8601 de la fecha/hora actual
 * 
 * @module src/utils/getCurrentDateTime
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Obtiene fecha/hora actual en formato ISO 8601
 *
 * @param {Object} options - Opciones de formato
 * @param {string} options.format - Formato personalizado (TODO: FASE 3)
 *
 * @returns {string} ISO 8601 timestamp (ej: 2026-04-11T15:30:45.123Z)
 *
 * @example
 * const now = getCurrentDateTime();
 * // "2026-04-11T15:30:45.123Z"
 *
 * @todo Agregar soporte para formatos personalizados en FASE 3
 */
export function getCurrentDateTime(options = {}) {
  return new Date().toISOString();
}
