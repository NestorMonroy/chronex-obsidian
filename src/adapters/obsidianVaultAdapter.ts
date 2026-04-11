/**
 * ObsidianVaultAdapter - Capa de abstracción para Obsidian API
 * 
 * Proporciona métodos para interactuar con el vault de Obsidian
 * basándose en la API real de Obsidian App.
 * 
 * Esto permite que nuestros servicios trabajen con archivos reales
 * sin acoplarse directamente a Obsidian API.
 */

import { App, TFile, TFolder, Notice, Vault } from 'obsidian';

export interface VaultFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  createdTime: number;
  modifiedTime: number;
}

export interface VaultFolder {
  path: string;
  name: string;
}

export class ObsidianVaultAdapter {
  private static instance: ObsidianVaultAdapter;
  private app: App | null = null;
  private vault: Vault | null = null;

  private constructor() {}

  /**
   * Singleton pattern - obtener instancia única
   */
  static getInstance(): ObsidianVaultAdapter {
    if (!ObsidianVaultAdapter.instance) {
      ObsidianVaultAdapter.instance = new ObsidianVaultAdapter();
    }
    return ObsidianVaultAdapter.instance;
  }

  /**
   * Inicializar adapter con App de Obsidian
   */
  static initialize(app: App): void {
    const instance = ObsidianVaultAdapter.getInstance();
    instance.app = app;
    instance.vault = app.vault;
    console.log('[ObsidianVaultAdapter] Initialized with Obsidian App');
  }

  /**
   * Verificar que está inicializado
   */
  private ensureInitialized(): void {
    if (!this.app || !this.vault) {
      throw new Error('ObsidianVaultAdapter not initialized. Call initialize(app) first.');
    }
  }

  /**
   * OPERACIONES DE CARPETA
   */

  async createFolder(folderPath: string): Promise<TFolder> {
    this.ensureInitialized();

    try {
      const existing = this.vault!.getAbstractFileByPath(folderPath);
      if (existing && existing instanceof TFolder) {
        console.log(`[Vault] Folder already exists: ${folderPath}`);
        return existing;
      }

      await this.vault!.createFolder(folderPath);
      const folder = this.vault!.getAbstractFileByPath(folderPath);

      if (!(folder instanceof TFolder)) {
        throw new Error(`Failed to create folder: ${folderPath}`);
      }

      console.log(`[Vault] Folder created: ${folderPath}`);
      return folder;
    } catch (error) {
      console.error(`[Vault] Error creating folder ${folderPath}:`, error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string): Promise<void> {
    this.ensureInitialized();

    try {
      const folder = this.vault!.getAbstractFileByPath(folderPath);
      if (folder && folder instanceof TFolder) {
        await this.vault!.delete(folder, true); // true = recursive
        console.log(`[Vault] Folder deleted: ${folderPath}`);
      }
    } catch (error) {
      console.error(`[Vault] Error deleting folder ${folderPath}:`, error);
      throw error;
    }
  }

  async folderExists(folderPath: string): Promise<boolean> {
    this.ensureInitialized();

    const file = this.vault!.getAbstractFileByPath(folderPath);
    return file instanceof TFolder;
  }

  /**
   * OPERACIONES DE ARCHIVO
   */

  async createFile(
    filePath: string,
    content: string,
    overwrite: boolean = false
  ): Promise<TFile> {
    this.ensureInitialized();

    try {
      const existing = this.vault!.getAbstractFileByPath(filePath);

      if (existing && existing instanceof TFile) {
        if (!overwrite) {
          throw new Error(`File already exists: ${filePath}`);
        }
        await this.vault!.modify(existing, content);
        console.log(`[Vault] File updated: ${filePath}`);
        return existing;
      }

      const file = await this.vault!.create(filePath, content);

      if (!(file instanceof TFile)) {
        throw new Error(`Failed to create file: ${filePath}`);
      }

      console.log(`[Vault] File created: ${filePath}`);
      return file;
    } catch (error) {
      console.error(`[Vault] Error creating file ${filePath}:`, error);
      throw error;
    }
  }

  async readFile(filePath: string): Promise<string> {
    this.ensureInitialized();

    try {
      const file = this.vault!.getAbstractFileByPath(filePath);

      if (!(file instanceof TFile)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await this.vault!.read(file);
      console.log(`[Vault] File read: ${filePath}`);
      return content;
    } catch (error) {
      console.error(`[Vault] Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  async updateFile(filePath: string, content: string): Promise<TFile> {
    this.ensureInitialized();

    try {
      const file = this.vault!.getAbstractFileByPath(filePath);

      if (!(file instanceof TFile)) {
        throw new Error(`File not found: ${filePath}`);
      }

      await this.vault!.modify(file, content);
      console.log(`[Vault] File updated: ${filePath}`);
      return file;
    } catch (error) {
      console.error(`[Vault] Error updating file ${filePath}:`, error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    this.ensureInitialized();

    try {
      const file = this.vault!.getAbstractFileByPath(filePath);

      if (file && file instanceof TFile) {
        await this.vault!.delete(file);
        console.log(`[Vault] File deleted: ${filePath}`);
      }
    } catch (error) {
      console.error(`[Vault] Error deleting file ${filePath}:`, error);
      throw error;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    this.ensureInitialized();

    const file = this.vault!.getAbstractFileByPath(filePath);
    return file instanceof TFile;
  }

  /**
   * OPERACIONES DE LECTURA
   */

  async getFiles(folderPath: string): Promise<TFile[]> {
    this.ensureInitialized();

    try {
      const folder = this.vault!.getAbstractFileByPath(folderPath);

      if (!(folder instanceof TFolder)) {
        return [];
      }

      const files: TFile[] = [];
      folder.children.forEach((child) => {
        if (child instanceof TFile) {
          files.push(child);
        }
      });

      return files;
    } catch (error) {
      console.error(`[Vault] Error getting files from ${folderPath}:`, error);
      return [];
    }
  }

  async getFolders(folderPath: string): Promise<TFolder[]> {
    this.ensureInitialized();

    try {
      const folder = this.vault!.getAbstractFileByPath(folderPath);

      if (!(folder instanceof TFolder)) {
        return [];
      }

      const folders: TFolder[] = [];
      folder.children.forEach((child) => {
        if (child instanceof TFolder) {
          folders.push(child);
        }
      });

      return folders;
    } catch (error) {
      console.error(`[Vault] Error getting folders from ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * UTILIDADES
   */

  async listProjectFolders(projectsFolder: string): Promise<VaultFolder[]> {
    const folders = await this.getFolders(projectsFolder);
    return folders.map((f) => ({
      path: f.path,
      name: f.name,
    }));
  }

  async listProjectFiles(projectFolderPath: string): Promise<VaultFile[]> {
    const files = await this.getFiles(projectFolderPath);
    return Promise.all(
      files.map(async (f) => ({
        path: f.path,
        name: f.name,
        extension: f.extension,
        content: await this.readFile(f.path),
        createdTime: f.stat.ctime,
        modifiedTime: f.stat.mtime,
      }))
    );
  }

  /**
   * FRONTMATTER UTILITIES
   */

  async updateFrontmatter(
    filePath: string,
    frontmatterData: Record<string, any>
  ): Promise<void> {
    const content = await this.readFile(filePath);

    // Extraer frontmatter existente
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) {
      throw new Error(`Invalid frontmatter in file: ${filePath}`);
    }

    const [, existingFrontmatter, bodyContent] = frontmatterMatch;
    const existingData: Record<string, any> = {};

    // Parse existing frontmatter
    existingFrontmatter.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        existingData[key.trim()] = valueParts.join(': ').trim();
      }
    });

    // Merge con nuevos datos
    const mergedData = { ...existingData, ...frontmatterData };

    // Generar nuevo frontmatter
    const newFrontmatter = Object.entries(mergedData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const newContent = `---\n${newFrontmatter}\n---\n${bodyContent}`;

    await this.updateFile(filePath, newContent);
  }

  /**
   * NOTIFICACIONES
   */

  showNotice(message: string, timeout: number = 5000): void {
    new Notice(message, timeout);
  }

  showErrorNotice(message: string, timeout: number = 5000): void {
    new Notice(`Error: ${message}`, timeout);
  }

  showSuccessNotice(message: string, timeout: number = 5000): void {
    new Notice(`Success: ${message}`, timeout);
  }
}

export const vaultAdapter = ObsidianVaultAdapter.getInstance();
