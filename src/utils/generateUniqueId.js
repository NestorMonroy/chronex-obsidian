/**
 * Módulo: Generación de ID único
 * Genera IDs únicos usando Web Crypto API
 *
 * @module src/utils/generateUniqueId
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 * @see PASO1-V4-OPERACIONES-ATOMICAS.md#OP-003
 */

/**
 * Genera ID único en formato: {prefix}-{timestamp}-{randomHex}
 *
 * @param {Object} options - Opciones de generación
 * @param {string} options.prefix - Prefijo personalizado (default: 'id')
 * @param {number} options.randomBytes - Bytes aleatorios (default: 6, = 12 hex chars)
 *
 * @returns {string} ID único (ej: id-1686000030567-a1b2c3d4e5f6)
 *
 * @throws {Error} Si Web Crypto API no está disponible
 *
 * @example
 * const id = generateUniqueId();
 * // "id-1686000030567-a1b2c3d4e5f6"
 *
 * const customId = generateUniqueId({ prefix: 'user' });
 * // "user-1686000030567-a1b2c3d4e5f6"
 *
 * @todo Agregar validación de opciones en FASE 3
 */
export function generateUniqueId(options = {}) {
  const prefix = options.prefix ?? 'id';
  const randomBytes = options.randomBytes ?? 6;

  // Validación: verificar que crypto esté disponible
  if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
    throw new Error('Web Crypto API no está disponible');
  }

  // Obtener timestamp actual
  const timestamp = Date.now();

  // Generar bytes aleatorios seguros
  const buffer = new Uint8Array(randomBytes);
  globalThis.crypto.getRandomValues(buffer);

  // Convertir a hexadecimal
  const randomHex = Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${prefix}-${timestamp}-${randomHex}`;
}
