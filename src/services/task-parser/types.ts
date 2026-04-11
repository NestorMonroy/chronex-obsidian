/**
 * UC-040: Types e Interfaces
 * 
 * Definiciones compartidas para parsing de tasks
 */

/**
 * Ubicación de una tarea en el vault
 */
export interface TaskLocation {
  path: string;
  lineNumber: number;
  precedingContent?: string;
}

/**
 * Status de una tarea
 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';

/**
 * Prioridad de una tarea
 */
export type TaskPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';

/**
 * Tarea parseada
 */
export interface ParsedTask {
  // Identificadores
  id?: string;
  
  // Contenido
  description: string;
  originalLine?: string;
  
  // Estado
  status: TaskStatus;
  priority: TaskPriority;
  
  // Fechas
  dueDate?: string; // YYYY-MM-DD
  scheduledDate?: string; // YYYY-MM-DD
  createdDate?: string;
  
  // Organización
  tags: string[];
  blockLink?: string;
  
  // Sistema
  filePath?: string;
  lineNumber?: number;
  parseSource?: 'obsidian-tasks' | 'fallback';
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Resultado del parsing
 */
export interface ParsedTaskResult {
  success: boolean;
  task?: ParsedTask;
  error?: string;
  warnings?: string[];
  metadata: {
    filePath?: string;
    lineNumber?: number;
    parsedAt: string; // ISO 8601
    source: 'obsidian-tasks' | 'fallback';
  };
}

export default {
  TaskLocation,
  TaskStatus,
  TaskPriority,
  ParsedTask,
  ValidationResult,
  ParsedTaskResult
};
