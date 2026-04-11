/**
 * Módulo Helper: Validadores
 * Centralizan lógica de validación reutilizable
 * 
 * @module src/utils/helpers/validators
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function isNullOrUndefined(value) {
  return value === null || value === undefined;
}

export function isString(value) {
  return typeof value === 'string';
}

export function isEmpty(value) {
  return !value || (typeof value === 'string' && value.trim().length === 0);
}

export function isValidLength(value, min, max) {
  return value && value.length >= min && value.length <= max;
}

export function matchesPattern(value, pattern) {
  return pattern.test(value);
}

export function isValidType(value, expectedType) {
  return typeof value === expectedType;
}
