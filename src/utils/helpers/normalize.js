/**
 * Módulo Helper: Normalización de texto
 * Centraliza lógica de normalización de texto reutilizable
 * 
 * @module src/utils/helpers/normalize
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 * @see FASE 3: SRP/DRY Refactoring
 */

/**
 * Normaliza texto: minúsculas, acentos, caracteres especiales
 *
 * @param {string} text - Texto a normalizar
 * @param {Object} options - Opciones de normalización
 * @param {boolean} options.removeAccents - Remover acentos (default: true)
 * @param {string} options.keepChars - Caracteres a mantener además de alfanuméricos
 *
 * @returns {string} Texto normalizado
 *
 * @example
 * normalizeText('Programación 2025')
 * // 'programacion 2025'
 *
 * normalizeText('a-b_c', { keepChars: '-_' })
 * // 'a-b_c'
 *
 * @todo Agregar opciones de transliteración en FASE 4
 */
export function normalizeText(text, options = {}) {
  const {
    removeAccents = true,
    keepChars = ''
  } = options;

  if (!text || text.trim().length === 0) {
    return '';
  }

  // 1. Convertir a minúsculas
  let normalized = text.toLowerCase();

  // 2. Remover acentos si se solicita
  if (removeAccents) {
    normalized = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // 3. Construir patrón regex para caracteres permitidos
  // Si removeAccents es false, permitir todos los caracteres latinos
  let allowedPattern;
  if (removeAccents) {
    allowedPattern = 'a-z0-9';
  } else {
    // Permitir: ASCII (a-z0-9) + Latin-1 Supplement (\u0080-\u00FF) + Extended-A (\u0100-\u017F)
    allowedPattern = 'a-z0-9\\u0080-\\u017f';
  }

  // 4. Añadir caracteres personalizados a mantener
  const charsPattern = keepChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const regex = new RegExp(`[^${allowedPattern}\\s${charsPattern}]`, 'g');
  normalized = normalized.replace(regex, '');

  // 5. Condensar espacios múltiples
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}
