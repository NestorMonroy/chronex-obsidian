/**
 * UC-045: Types e Interfaces
 * 
 * Definiciones para Task Completion Handler
 */

export interface CompletionAction {
  id: string;
  type: 'log' | 'archive' | 'notify' | 'webhook' | 'custom';
  enabled: boolean;
  config?: any;
  priority?: number;
}

export interface CompletionEvent {
  taskId: string;
  taskDescription: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  metadata?: any;
}

export interface ActionResult {
  actionId: string;
  success: boolean;
  error?: string;
  duration: number;
}

export interface ExecutionRecord {
  timestamp: string;
  eventTaskId: string;
  results: ActionResult[];
}

