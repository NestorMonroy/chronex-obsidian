/**
 * Tipos para DataManager
 * SEMANA 2: Cache + Sincronización
 */

export interface CachedTask {
  taskId: string;
  folderPath: string;
  notePath: string;
  frontmatter: Record<string, any>;
  content?: string;
  lastUpdate: number; // timestamp
  isDirty?: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live en ms (default: 5 minutos)
  maxSize?: number; // Máximo de items en cache (default: 1000)
}

export interface TaskChangeEvent {
  type: 'create' | 'update' | 'delete';
  taskId: string;
  data?: Partial<CachedTask>;
  timestamp: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: number;
  pendingChanges: number;
  errors: string[];
}

export interface DataManagerConfig {
  cacheOptions?: CacheOptions;
  autoSync?: boolean;
  syncInterval?: number; // ms (default: 10 segundos)
}
