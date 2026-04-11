/**
 * DataManager - Módulo completo
 * Exportación principal
 */

export { DataManager, dataManager } from './DataManager';
export { TaskCache } from './TaskCache';
export { EventEmitter } from './EventEmitter';
export type {
  CachedTask,
  CacheOptions,
  TaskChangeEvent,
  SyncStatus,
  DataManagerConfig,
} from './types';
