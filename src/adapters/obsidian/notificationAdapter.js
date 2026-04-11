/**
 * Adaptador Obsidian: Notificaciones
 * Integra showNotification con Obsidian.Notice
 * 
 * @module src/adapters/obsidian/notificationAdapter
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function showObsidianNotification(app, message, type = 'info', duration = 3000) {
  if (!app) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return { message, type, duration };
  }
  // TODO: Integrar con Obsidian.Notice en próximas versiones
  console.log(`[${type.toUpperCase()}] ${message}`);
  return { message, type, duration };
}

export function createNotificationAdapter(app) {
  return {
    success: (msg, duration = 3000) => showObsidianNotification(app, msg, 'success', duration),
    error: (msg, duration = 3000) => showObsidianNotification(app, msg, 'error', duration),
    warning: (msg, duration = 3000) => showObsidianNotification(app, msg, 'warning', duration),
    info: (msg, duration = 3000) => showObsidianNotification(app, msg, 'info', duration)
  };
}
