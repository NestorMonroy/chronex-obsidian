/**
 * DataManager - Módulo completo
 * Exportación principal
 */

export { DataManager, dataManager } from './dataManager';
export { TaskCache } from './taskCache';
export { EventEmitter } from './eventEmitter';
export type {
  CachedTask,
  CacheOptions,
  TaskChangeEvent,
  SyncStatus,
  DataManagerConfig,
} from './types';
