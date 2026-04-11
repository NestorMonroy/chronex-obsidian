/**
 * Módulo: Validación de entrada común
 * Valida inputs según convenciones PASO 2
 *
 * @module src/utils/validateCommonInput
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 * @see PASO2-UC-001-REPOSITORY.md#Paso-6-Validar-Entrada
 */

// Constantes
const VALID_CHARACTERS = /^[a-zA-Z0-9\-_\s]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 255;

/**
 * Valida entrada común según reglas PASO 2
 *
 * @param {string} input - Valor a validar
 * @param {Object} options - Opciones de validación
 * @param {number} options.minLength - Longitud mínima (default: 3)
 * @param {number} options.maxLength - Longitud máxima (default: 255)
 * @param {RegExp} options.pattern - Patrón regex personalizado
 *
 * @returns {Object} { isValid: boolean, errors: string[] }
 *
 * @throws {TypeError} Si options es inválido
 *
 * @example
 * const result = validateCommonInput('Mi Proyecto');
 * if (result.isValid) {
 *   console.log('Válido');
 * } else {
 *   console.log('Errores:', result.errors);
 * }
 *
 * @todo Agregar soporte para caracteres acentuados en FASE 3
 */
export function validateCommonInput(input, options = {}) {
  const errors = [];

  // Validación 1: Verificar que input sea string no-vacío
  if (input === null || input === undefined) {
    errors.push('Input no puede ser null o undefined');
    return { isValid: false, errors };
  }

  if (typeof input !== 'string') {
    errors.push('Input debe ser una cadena de texto (string)');
    return { isValid: false, errors };
  }

  if (input.length === 0) {
    errors.push('Input no puede estar vacío');
    return { isValid: false, errors };
  }

  // Obtener límites de opciones
  const minLength = options.minLength ?? MIN_LENGTH;
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const pattern = options.pattern ?? VALID_CHARACTERS;

  // Validación 2: Longitud mínima (basada en longitud original)
  if (input.length < minLength) {
    errors.push(`Input debe tener mínimo ${minLength} caracteres (actual: ${input.length})`);
  }

  // Validación 3: Longitud máxima
  if (input.length > maxLength) {
    errors.push(`Input debe tener máximo ${maxLength} caracteres (actual: ${input.length})`);
  }

  // Validación 4: Caracteres válidos
  if (!pattern.test(input)) {
    errors.push('Input contiene caracteres inválidos');
  }

  // Validación 5: No solo espacios
  if (input.trim().length === 0) {
    errors.push('Input no puede contener solo espacios');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
