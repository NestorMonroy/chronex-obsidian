/**
 * IndexSyncService - Mantener .index.json sincronizado automáticamente
 * 
 * Cuando editas metadatos de una entidad, el índice se actualiza automáticamente.
 * SIN este servicio: cambios en README.md no se reflejan en .index.json
 * CON este servicio: sincronización automática total
 */

import { ObsidianVaultAdapter } from '../adapters/obsidianVaultAdapter';

export interface IndexEntry {
  id: string;              // PROJ-YYYYMM-XXXXX, OBJ-ID, TSK-ID, DOC-ID
  type: string;            // 'proyecto', 'objetivo', 'tarea', 'documento'
  title: string;
  description?: string;
  path: string;            // Ruta de la carpeta
  status: string;          // 'activo', 'archivado'
  priority?: string;       // BAJA, MEDIA, ALTA, CRÍTICA
  dateCreated: string;     // YYYY-MM-DD
  lastModified: string;    // ISO timestamp
  metadata?: Record<string, any>;
}

export interface VaultIndex {
  projects: IndexEntry[];
  objectives: IndexEntry[];
  tasks: IndexEntry[];
  documents: IndexEntry[];
  lastSync: string;
}

export class IndexSyncService {
  private static readonly INDEX_FILE = '.index.json';
  private static readonly PROJECTS_FOLDER = '200-PROYECTOS';

  /**
   * Inicializar índice (crear si no existe)
   */
  static async initializeIndex(): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const exists = await vault.fileExists(this.INDEX_FILE);

      if (!exists) {
        const emptyIndex: VaultIndex = {
          projects: [],
          objectives: [],
          tasks: [],
          documents: [],
          lastSync: new Date().toISOString()
        };

        await vault.createFile(
          this.INDEX_FILE,
          JSON.stringify(emptyIndex, null, 2)
        );

        console.log('[IndexSync] Initialized .index.json');
      }
    } catch (error) {
      console.warn('[IndexSync] Error initializing index:', error);
    }
  }

  /**
   * AUTO-SYNC: Actualizar entrada en índice cuando metadatos cambian
   */
  static async updateIndexEntry(
    type: string,
    id: string,
    data: Partial<IndexEntry>
  ): Promise<void> {
    try {
      const index = await this.readIndex();

      if (!index) {
        return;
      }

      const collection = this.getCollection(index, type);
      if (!collection) {
        return;
      }

      const entryIndex = collection.findIndex((e) => e.id === id);

      if (entryIndex === -1) {
        // Nueva entrada
        collection.push({
          id,
          type,
          title: data.title || 'Untitled',
          path: data.path || '',
          status: data.status || 'activo',
          dateCreated: data.dateCreated || new Date().toISOString().split('T')[0],
          lastModified: new Date().toISOString(),
          description: data.description,
          priority: data.priority,
          metadata: data.metadata
        });

        console.log(`[IndexSync] Added ${type}: ${id}`);
      } else {
        // Actualizar entrada existente
        const entry = collection[entryIndex];

        if (data.title) entry.title = data.title;
        if (data.description) entry.description = data.description;
        if (data.status) entry.status = data.status;
        if (data.priority) entry.priority = data.priority;
        if (data.path) entry.path = data.path;
        if (data.metadata) entry.metadata = data.metadata;

        entry.lastModified = new Date().toISOString();

        console.log(`[IndexSync] Updated ${type}: ${id}`);
      }

      index.lastSync = new Date().toISOString();
      await this.writeIndex(index);
    } catch (error) {
      console.warn('[IndexSync] Error updating entry:', error);
    }
  }

  /**
   * AUTO-DELETE: Eliminar entrada cuando se borra entidad
   */
  static async deleteIndexEntry(type: string, id: string): Promise<void> {
    try {
      const index = await this.readIndex();

      if (!index) {
        return;
      }

      const collection = this.getCollection(index, type);
      if (!collection) {
        return;
      }

      const entryIndex = collection.findIndex((e) => e.id === id);

      if (entryIndex !== -1) {
        collection.splice(entryIndex, 1);
        index.lastSync = new Date().toISOString();
        await this.writeIndex(index);

        console.log(`[IndexSync] Deleted ${type}: ${id}`);
      }
    } catch (error) {
      console.warn('[IndexSync] Error deleting entry:', error);
    }
  }

  /**
   * Leer índice completo
   */
  static async readIndex(): Promise<VaultIndex | null> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const exists = await vault.fileExists(this.INDEX_FILE);

      if (!exists) {
        return null;
      }

      const content = await vault.readFile(this.INDEX_FILE);
      return JSON.parse(content);
    } catch (error) {
      console.warn('[IndexSync] Error reading index:', error);
      return null;
    }
  }

  /**
   * Buscar entrada en índice
   */
  static async findEntry(type: string, id: string): Promise<IndexEntry | null> {
    const index = await this.readIndex();

    if (!index) {
      return null;
    }

    const collection = this.getCollection(index, type);
    if (!collection) {
      return null;
    }

    return collection.find((e) => e.id === id) || null;
  }

  /**
   * Escribir índice
   */
  private static async writeIndex(index: VaultIndex): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      await vault.updateFile(
        this.INDEX_FILE,
        JSON.stringify(index, null, 2)
      );
    } catch (error) {
      console.warn('[IndexSync] Error writing index:', error);
    }
  }

  /**
   * Obtener colección según tipo
   */
  private static getCollection(
    index: VaultIndex,
    type: string
  ): IndexEntry[] | null {
    switch (type.toLowerCase()) {
      case 'proyecto':
        return index.projects;
      case 'objetivo':
        return index.objectives;
      case 'tarea':
        return index.tasks;
      case 'documento':
        return index.documents;
      default:
        return null;
    }
  }

  /**
   * Obtener estadísticas del índice
   */
  static async getStats(): Promise<Record<string, number> | null> {
    const index = await this.readIndex();

    if (!index) {
      return null;
    }

    return {
      projects: index.projects.length,
      objectives: index.objectives.length,
      tasks: index.tasks.length,
      documents: index.documents.length,
      total:
        index.projects.length +
        index.objectives.length +
        index.tasks.length +
        index.documents.length
    };
  }
}
