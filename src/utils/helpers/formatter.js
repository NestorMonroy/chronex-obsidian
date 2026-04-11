/**
 * Módulo Helper: Formateadores
 * Centraliza lógica de formateo de datos
 * 
 * @module src/utils/helpers/formatter
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function formatType(type) {
  if (!type) return 'info';
  return type.toLowerCase();
}

export function formatMessage(message) {
  if (!message) return '';
  return String(message).trim();
}

export function formatDuration(duration) {
  return Math.max(0, parseInt(duration) || 3000);
}

export function formatNotification(message, type = 'info', duration = 3000) {
  return {
    message: formatMessage(message),
    type: formatType(type),
    duration: formatDuration(duration)
  };
}
