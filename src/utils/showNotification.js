/**
 * Módulo: Mostrar notificación al usuario
 * @module src/utils/showNotification
 * @version 1.0.0
 * @todo Implementar en FASE 2
 */
export function showNotification(message, type = 'info') {
  // TODO: FASE 2 - Usar app.notice o QuickAdd notifications
  const prefix = `[${type.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  console.log(prefix, message);
}
