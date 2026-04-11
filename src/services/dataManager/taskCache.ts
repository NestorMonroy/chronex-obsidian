/**
 * TaskCache - Cache en memoria para tareas
 * SEMANA 2: Almacenamiento y invalidación
 */

import { CachedTask, CacheOptions } from './types';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const DEFAULT_MAX_SIZE = 1000;

export class TaskCache {
  private cache: Map<string, CachedTask> = new Map();
  private ttl: number;
  private maxSize: number;
  private timestamps: Map<string, number> = new Map();

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || DEFAULT_TTL;
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  }

  /**
   * Obtener tarea del cache
   */
  get(taskId: string): CachedTask | null {
    const task = this.cache.get(taskId);

    if (!task) {
      return null;
    }

    // Verificar si expiró
    const cacheTime = this.timestamps.get(taskId) || 0;
    const now = Date.now();

    if (now - cacheTime > this.ttl) {
      this.cache.delete(taskId);
      this.timestamps.delete(taskId);
      return null;
    }

    return task;
  }

  /**
   * Guardar tarea en cache
   */
  set(taskId: string, task: CachedTask): void {
    // Limpiar si alcanzamos max size
    if (this.cache.size >= this.maxSize && !this.cache.has(taskId)) {
      const oldestKey = Array.from(this.timestamps.entries()).sort(
        ([, a], [, b]) => a - b
      )[0]?.[0];

      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.timestamps.delete(oldestKey);
      }
    }

    this.cache.set(taskId, task);
    this.timestamps.set(taskId, Date.now());
  }

  /**
   * Invalidar una tarea
   */
  invalidate(taskId: string): void {
    this.cache.delete(taskId);
    this.timestamps.delete(taskId);
  }

  /**
   * Invalidar todas las tareas
   */
  invalidateAll(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Obtener todas las tareas en cache
   */
  getAll(): CachedTask[] {
    const now = Date.now();
    const expired: string[] = [];

    const tasks = Array.from(this.cache.entries())
      .filter(([taskId, _]) => {
        const cacheTime = this.timestamps.get(taskId) || 0;
        if (now - cacheTime > this.ttl) {
          expired.push(taskId);
          return false;
        }
        return true;
      })
      .map(([_, task]) => task);

    // Limpiar expirados
    expired.forEach((taskId) => {
      this.cache.delete(taskId);
      this.timestamps.delete(taskId);
    });

    return tasks;
  }

  /**
   * Verificar si existe en cache
   */
  has(taskId: string): boolean {
    return this.get(taskId) !== null;
  }

  /**
   * Contar items en cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      utilization: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%',
    };
  }
}
