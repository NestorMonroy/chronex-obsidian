import { isNullOrUndefined, isString, isEmpty, isValidLength, matchesPattern } from './helpers/validators.js';

const VALID_CHARACTERS = /^[a-zA-Z0-9\-_\s]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 255;

export function validateCommonInput(input, options = {}) {
  const errors = [];

  // Validación 1: null/undefined
  if (isNullOrUndefined(input)) {
    errors.push('Input no puede ser null o undefined');
    return { isValid: false, errors };
  }

  // Validación 2: type string
  if (!isString(input)) {
    errors.push('Input debe ser una cadena de texto (string)');
    return { isValid: false, errors };
  }

  // Validación 3: no vacío
  if (isEmpty(input)) {
    errors.push('Input no puede estar vacío');
    return { isValid: false, errors };
  }

  const minLength = options.minLength ?? MIN_LENGTH;
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const pattern = options.pattern ?? VALID_CHARACTERS;

  // Validación 4: longitud mínima
  if (input.length < minLength) {
    errors.push(`Input debe tener mínimo ${minLength} caracteres (actual: ${input.length})`);
  }

  // Validación 5: longitud máxima
  if (input.length > maxLength) {
    errors.push(`Input debe tener máximo ${maxLength} caracteres (actual: ${input.length})`);
  }

  // Validación 6: patrón
  if (!matchesPattern(input, pattern)) {
    errors.push('Input contiene caracteres inválidos');
  }

  // Validación 7: no solo espacios
  if (input.trim().length === 0) {
    errors.push('Input no puede contener solo espacios');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
