/**
 * Módulo Helper: Utilidades de rutas
 * Centraliza operaciones con rutas de archivos
 * 
 * @module src/utils/helpers/pathUtils
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function splitPath(path) {
  const normalized = normalizePath(path);
  return normalized.split('/').filter(p => p.length > 0);
}

export function joinPath(...parts) {
  return parts.filter(p => p).join('/');
}

export function getParentFolder(path) {
  const parts = splitPath(path);
  if (parts.length <= 1) return '.';
  return joinPath(...parts.slice(0, -1));
}

export function getFileName(path) {
  const parts = splitPath(path);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

export function getExtension(path) {
  const fileName = getFileName(path);
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot) : '';
}
