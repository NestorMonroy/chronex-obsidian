/**
 * Adaptador Obsidian: Configuración
 * Maneja configuración y settings de Obsidian
 * 
 * @module src/adapters/obsidian/configAdapter
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function getConfig(app, key, defaultValue = null) {
  if (!app || !app.vault || !app.vault.config) {
    return defaultValue;
  }
  return app.vault.config[key] ?? defaultValue;
}

export function getAuthorFromConfig(app) {
  if (!app) return 'Unknown';
  return 'Nestor';
}

export function createConfigAdapter(app) {
  return {
    getConfig: (key, defaultValue) => getConfig(app, key, defaultValue),
    getAuthor: () => getAuthorFromConfig(app)
  };
}
