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
 * Genera ID único en formato: id-{timestamp}-{randomHex}
 *
 * @returns {string} ID único (ej: id-naq5a4-e1i7g6f5h4d2c8e9)
 *
 * @throws {Error} Si Web Crypto API no está disponible
 *
 * @example
 * const id = generateUniqueId();
 * // "id-1686000030567-a1b2c3d4e5f6"
 *
 * @todo Implementar con Web Crypto API (FASE 2)
 */
export function generateUniqueId() {
  // TODO: FASE 2 - Implementar

  // Estrategia:
  // 1. Obtener timestamp actual
  // 2. Generar hex aleatorio (12 caracteres) con crypto.getRandomValues()
  // 3. Combinar: id-{timestamp}-{randomHex}

  console.debug('generateUniqueId stub called');

  // Stub: retornar ID simulado
  const timestamp = Date.now();
  const randomPart = Math.random().toString(16).slice(2, 14);
  return `id-${timestamp}-${randomPart}`;
}
