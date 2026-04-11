/**
 * UC-054: vaultReader
 * 
 * Sistema para leer archivos del Vault de Obsidian SIN DEPENDENCIAS.
 * Solo usa Obsidian API, no requiere Dataview.
 */

import type {
  TFile,
  VaultAPI,
  App,
  TaskInFile,
  SearchResult,
  FileContent
} from './types';

export class VaultReader {
  private app: App;
  private filesCache: TFile[] | null = null;
  private taskLinesRegex = /^[ \t]*[-*]\s+\[([ xX-])\]/gm;

  constructor(app: App) {
    if (!app) {
      throw new Error('App is required');
    }
    if (!app.vault) {
      throw new Error('Vault API is required');
    }
    this.app = app;
  }

  /**
   * Obtener todos los archivos markdown del vault
   */
  async getMarkdownFiles(): Promise<TFile[]> {
    // Usar cache si existe
    if (this.filesCache) {
      return this.filesCache;
    }

    const files = this.app.vault.getMarkdownFiles();
    this.filesCache = files;
    return files;
  }

  /**
   * Leer contenido de un archivo
   */
  async readFile(file: TFile | null): Promise<string | null> {
    if (!file) {
      return null;
    }

    try {
      const content = await this.app.vault.read(file);
      return content || '';
    } catch (error) {
      console.error(`Error reading file ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Encontrar todas las líneas de task en un archivo
   */
  async findTasksInFile(file: TFile | null): Promise<TaskInFile[]> {
    if (!file) {
      return [];
    }

    const content = await this.readFile(file);
    if (!content) {
      return [];
    }

    const tasks: TaskInFile[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Buscar patrón de task: [ ], [x], [X], [-], etc
      if (/\[([ xX-])\]/.test(line)) {
        tasks.push({
          filePath: file.path,
          fileName: file.name,
          lineNumber,
          line: line.trim()
        });
      }
    });

    return tasks;
  }

  /**
   * Obtener todas las tasks del vault
   */
  async getAllTasks(): Promise<TaskInFile[]> {
    const files = await this.getMarkdownFiles();
    const allTasks: TaskInFile[] = [];

    for (const file of files) {
      const fileTasks = await this.findTasksInFile(file);
      allTasks.push(...fileTasks);
    }

    return allTasks;
  }

  /**
   * Filtrar tasks por carpeta
   */
  filterByFolder(tasks: TaskInFile[], folderPath: string): TaskInFile[] {
    return tasks.filter(task => task.filePath.startsWith(folderPath));
  }

  /**
   * Filtrar tasks por patrón (búsqueda en texto)
   */
  filterByPattern(tasks: TaskInFile[], pattern: string): TaskInFile[] {
    const regex = new RegExp(pattern, 'i');
    return tasks.filter(task => regex.test(task.line));
  }

  /**
   * Filtrar tasks por archivo específico
   */
  filterByFile(tasks: TaskInFile[], fileName: string): TaskInFile[] {
    return tasks.filter(task => task.filePath === fileName);
  }

  /**
   * Escribir contenido en un archivo
   */
  async writeFile(file: TFile | null, content: string): Promise<boolean> {
    if (!file) {
      return false;
    }

    try {
      await this.app.vault.modify(file, content);
      return true;
    } catch (error) {
      console.error(`Error writing file ${file.path}:`, error);
      return false;
    }
  }

  /**
   * Actualizar una línea específica en un archivo
   */
  async updateLine(file: TFile, lineNumber: number, newLine: string): Promise<string> {
    const content = await this.readFile(file);
    if (!content) {
      return '';
    }

    const lines = content.split('\n');
    if (lineNumber < 0 || lineNumber >= lines.length) {
      return content;
    }

    lines[lineNumber] = newLine;
    const updatedContent = lines.join('\n');

    await this.writeFile(file, updatedContent);
    return updatedContent;
  }

  /**
   * Buscar tasks que contengan texto específico
   */
  async searchTasks(query: string): Promise<TaskInFile[]> {
    const allTasks = await this.getAllTasks();
    return this.filterByPattern(allTasks, query);
  }

  /**
   * Obtener tasks de hoy (si existen en daily notes)
   */
  async getTasksForToday(): Promise<TaskInFile[]> {
    const today = new Date().toISOString().split('T')[0];
    const files = await this.getMarkdownFiles();

    // Buscar archivo con fecha de hoy (YYYY-MM-DD.md)
    const todayFile = files.find(f => f.name === today);

    if (!todayFile) {
      return [];
    }

    return this.findTasksInFile(todayFile);
  }

  /**
   * Obtener tasks de una carpeta específica
   */
  async getTasksFromFolder(folderPath: string): Promise<TaskInFile[]> {
    const files = await this.getMarkdownFiles();
    const folderFiles = files.filter(f => f.path.startsWith(folderPath));

    const allTasks: TaskInFile[] = [];

    for (const file of folderFiles) {
      const fileTasks = await this.findTasksInFile(file);
      allTasks.push(...fileTasks);
    }

    return allTasks;
  }

  /**
   * Validar que un archivo existe en el vault
   */
  async fileExists(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof Object && 'read' in (file as any);
  }

  /**
   * Obtener archivo por path
   */
  getFileByPath(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file && 'read' in (file as any)) {
      return file as TFile;
    }
    return null;
  }

  /**
   * Limpiar cache (para refrescar lista de archivos)
   */
  clearCache(): void {
    this.filesCache = null;
  }

  /**
   * Obtener estadísticas del vault
   */
  async getVaultStats(): Promise<{
    totalFiles: number;
    totalTasks: number;
    tasksCompleted: number;
    tasksTodo: number;
  }> {
    const files = await this.getMarkdownFiles();
    const allTasks = await this.getAllTasks();

    const tasksCompleted = allTasks.filter(t => /\[[xX]\]/.test(t.line)).length;
    const tasksTodo = allTasks.filter(t => /\[[ -]\]/.test(t.line)).length;

    return {
      totalFiles: files.length,
      totalTasks: allTasks.length,
      tasksCompleted,
      tasksTodo
    };
  }
}

export default VaultReader;
