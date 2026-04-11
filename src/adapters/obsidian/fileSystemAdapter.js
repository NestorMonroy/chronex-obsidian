/**
 * Adaptador Obsidian: Sistema de archivos
 * Integra utilidades de ruta con Obsidian Vault API
 * 
 * @module src/adapters/obsidian/fileSystemAdapter
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function getFileByPath(vault, path) {
  if (!vault || !vault.getAbstractFileByPath) {
    return null;
  }
  return vault.getAbstractFileByPath(path);
}

export async function createFile(vault, path, content = '') {
  if (!vault || !vault.create) {
    return null;
  }
  try {
    return await vault.create(path, content);
  } catch (error) {
    console.error(`Error creating file: ${path}`, error);
    return null;
  }
}

export async function readFile(vault, path) {
  if (!vault || !vault.getAbstractFileByPath || !vault.read) {
    return null;
  }
  try {
    const file = vault.getAbstractFileByPath(path);
    if (!file || file.constructor.name !== 'TFile') {
      return null;
    }
    return await vault.read(file);
  } catch (error) {
    console.error(`Error reading file: ${path}`, error);
    return null;
  }
}

export function createFileSystemAdapter(vault) {
  return {
    getFile: (path) => getFileByPath(vault, path),
    createFile: (path, content) => createFile(vault, path, content),
    readFile: (path) => readFile(vault, path)
  };
}
