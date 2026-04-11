/**
 * Módulo: Mostrar notificación
 * Muestra notificaciones al usuario en varios niveles
 * 
 * @module src/utils/showNotification
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

/**
 * Muestra una notificación al usuario
 *
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success|error|warning|info)
 * @param {Object} options - Opciones de notificación
 * @param {number} options.duration - Duración en ms (default: 3000)
 *
 * @returns {Object} Objeto de notificación mostrada
 *
 * @example
 * showNotification('Operación completada', 'success');
 * showNotification('Error en la operación', 'error', { duration: 5000 });
 *
 * @todo Integrar con Obsidian.Notice en FASE 4
 */

import { formatNotification } from './helpers/formatter.js';

export function showNotification(message, type = 'info', options = {}) {
  const duration = options.duration ?? 3000;
  const notification = formatNotification(message, type, duration);
  console.log(`[${notification.type.toUpperCase()}] ${notification.message}`);
  return notification;
}
