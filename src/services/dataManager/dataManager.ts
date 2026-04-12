/**
 * DataManager - Gestor central de tareas
 * SEMANA 2: Cache + Sincronización + Eventos
 */

import { TaskServiceWithVault } from '../taskServiceWithVault';
import { TaskCache } from './taskCache';
import { EventEmitter } from './eventEmitter';
import { DataManager, Config } from './types';

export class DataManager {
  private static instance: DataManager;
  private cache: TaskCache;
  private eventEmitter: EventEmitter;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: 0,
    pendingChanges: 0,
    errors: [],
  };
  private autoSyncInterval?: NodeJS.Timeout;
  private config: DataManagerConfig;

  private constructor(config: DataManagerConfig = {}) {
    this.config = config;
    this.cache = new TaskCache(config.cacheOptions);
    this.eventEmitter = new EventEmitter();

    // Inicializar auto-sync si está habilitado
    if (config.autoSync) {
      this.startAutoSync(config.syncInterval || 10000);
    }
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance(config?: DataManagerConfig): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager(config);
    }
    return DataManager.instance;
  }

  // ==================== LECTURA ====================

  /**
   * Obtener tarea por ID
   * Primero intenta cache, luego vault
   */
  async getTask(taskId: string): Promise<CachedTask | null> {
    // Intentar desde cache
    const cached = this.cache.get(taskId);
    if (cached) {
      return cached;
    }

    // Obtener del vault
    const task = await TaskServiceWithVault.getTaskById(taskId);
    if (!task) {
      return null;
    }

    // Guardar en cache
    const cachedTask: CachedTask = {
      taskId: task.taskId!,
      folderPath: task.folderPath!,
      notePath: task.notePath!,
      frontmatter: task.frontmatter!,
      lastUpdate: Date.now(),
    };

    this.cache.set(taskId, cachedTask);
    return cachedTask;
  }

  /**
   * Obtener todas las tareas de un proyecto
   */
  async getProjectTasks(projectId?: string): Promise<CachedTask[]> {
    // Obtener del vault
    const tasks = await TaskServiceWithVault.listTasksFromVault(projectId);

    // Guardar en cache
    const cachedTasks = tasks.map((t) => ({
      taskId: t.taskId!,
      folderPath: t.folderPath!,
      notePath: t.notePath!,
      frontmatter: t.frontmatter!,
      lastUpdate: Date.now(),
    }));

    cachedTasks.forEach((task) => {
      this.cache.set(task.taskId, task);
    });

    return cachedTasks;
  }

  /**
   * Obtener todas las tareas del cache (sin reload)
   */
  getCachedTasks(): CachedTask[] {
    return this.cache.getAll();
  }

  // ==================== ESCRITURA ====================

  /**
   * Actualizar tarea
   */
  async updateTask(
    taskId: string,
    updates: {
      taskName?: string;
      description?: string;
      priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
      dueDate?: string;
    }
  ): Promise<CachedTask | null> {
    const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);

    if (!result.success) {
      this.syncStatus.errors.push(result.error || 'Unknown error');
      return null;
    }

    // Invalidar cache
    this.cache.invalidate(taskId);

    // Emitir evento
    this.eventEmitter.emit({
      type: 'update',
      taskId,
      timestamp: Date.now(),
      data: {
        frontmatter: result.frontmatter,
      },
    });

    // Obtener tarea actualizada
    return this.getTask(taskId);
  }

  /**
   * Eliminar tarea
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const result = await TaskServiceWithVault.deleteTaskWithVault(taskId);

    if (!result.success) {
      this.syncStatus.errors.push(result.error || 'Unknown error');
      return false;
    }

    // Invalidar cache
    this.cache.invalidate(taskId);

    // Emitir evento
    this.eventEmitter.emit({
      type: 'delete',
      taskId,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Crear tarea
   */
  async createTask(input: {
    taskName: string;
    description?: string;
    priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
    dueDate?: string;
    parentObjectiveId?: string;
  }): Promise<CachedTask | null> {
    const result = await TaskServiceWithVault.createTaskWithVault(input);

    if (!result.success) {
      this.syncStatus.errors.push(result.error || 'Unknown error');
      return null;
    }

    const cachedTask: CachedTask = {
      taskId: result.taskId!,
      folderPath: result.folderPath!,
      notePath: result.notePath!,
      frontmatter: result.frontmatter!,
      lastUpdate: Date.now(),
    };

    this.cache.set(result.taskId!, cachedTask);

    // Emitir evento
    this.eventEmitter.emit({
      type: 'create',
      taskId: result.taskId!,
      timestamp: Date.now(),
      data: cachedTask,
    });

    return cachedTask;
  }

  // ==================== EVENTOS ====================

  /**
   * Suscribirse a cambios
   */
  onChange(
    callback: (event: TaskChangeEvent) => void,
    eventType?: 'create' | 'update' | 'delete'
  ): () => void {
    return this.eventEmitter.on(eventType || '*', callback);
  }

  /**
   * Suscribirse una sola vez
   */
  onceChange(
    callback: (event: TaskChangeEvent) => void,
    eventType?: 'create' | 'update' | 'delete'
  ): () => void {
    return this.eventEmitter.once(eventType || '*', callback);
  }

  // ==================== CACHE ====================

  /**
   * Limpiar cache
   */
  invalidateCache(taskId?: string): void {
    if (taskId) {
      this.cache.invalidate(taskId);
    } else {
      this.cache.invalidateAll();
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Recargar tareas desde vault
   */
  async reload(projectId?: string): Promise<CachedTask[]> {
    this.syncStatus.isSyncing = true;
    this.syncStatus.errors = [];

    try {
      const tasks = await this.getProjectTasks(projectId);
      this.syncStatus.lastSync = Date.now();
      this.syncStatus.pendingChanges = 0;
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.syncStatus.errors.push(errorMessage);
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Iniciar auto-sync
   */
  private startAutoSync(interval: number): void {
    this.autoSyncInterval = setInterval(() => {
      this.reload().catch((error) => {
        console.error('[DataManager] Auto-sync error:', error);
      });
    }, interval);
  }

  /**
   * Detener auto-sync
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = undefined;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener total de tareas en cache
   */
  getTaskCount(): number {
    return this.cache.size();
  }

  /**
   * Limpiar todo (cache, eventos, sync)
   */
  clear(): void {
    this.stopAutoSync();
    this.cache.invalidateAll();
    this.eventEmitter.clear();
    this.syncStatus.errors = [];
    this.syncStatus.pendingChanges = 0;
  }

  /**
   * Resetear singleton (para testing)
   */
  static reset(): void {
    if (DataManager.instance) {
      DataManager.instance.clear();
      DataManager.instance = undefined as any;
    }
  }
}

// Exportar instancia global
export const dataManager = DataManager.getInstance({
  autoSync: true,
  syncInterval: 10000,
  cacheOptions: {
    ttl: 5 * 60 * 1000,
    maxSize: 1000,
  },
});
