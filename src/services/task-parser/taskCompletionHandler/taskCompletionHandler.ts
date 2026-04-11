/**
 * UC-045: taskCompletionHandler
 * 
 * NUESTRO SISTEMA INDEPENDIENTE para ejecutar acciones al completar tareas.
 * 
 * Permite registrar acciones y hooks que se ejecutan automáticamente
 * cuando una tarea cambia de status a DONE.
 */

import type {
  CompletionAction,
  CompletionEvent,
  ActionResult,
  ExecutionRecord
} from './types';

export class TaskCompletionHandler {
  private actions: Map<string, CompletionAction> = new Map();
  private hooks: Map<string, Function> = new Map();
  private executionHistory: ExecutionRecord[] = [];
  private maxHistorySize: number = 1000;

  // Validar statuses conocidos
  private validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'FORWARDED'];

  /**
   * Registrar una acción al completar
   */
  registerAction(action: CompletionAction): boolean {
    if (!action || !action.id || !action.type) {
      return false;
    }

    if (this.actions.has(action.id)) {
      return false;
    }

    this.actions.set(action.id, { ...action });
    return true;
  }

  /**
   * Obtener acción por id
   */
  getAction(id: string): CompletionAction | undefined {
    return this.actions.get(id);
  }

  /**
   * Obtener todas las acciones
   */
  getAllActions(): CompletionAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Ejecutar acciones al completar una tarea
   */
  executeActionsOnCompletion(event: CompletionEvent): ActionResult[] {
    const results: ActionResult[] = [];

    // Validar evento
    if (!this.validateEvent(event)) {
      return results;
    }

    // Obtener acciones habilitadas y ordenar por prioridad
    const enabledActions = Array.from(this.actions.values())
      .filter(a => a.enabled)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    // Ejecutar cada acción
    for (const action of enabledActions) {
      const startTime = performance.now();

      try {
        // Verificar condición si existe
        if (action.config?.condition) {
          if (!action.config.condition(event)) {
            continue;
          }
        }

        // Ejecutar acción según tipo
        const success = this.executeActionByType(action, event);

        const duration = performance.now() - startTime;

        results.push({
          actionId: action.id,
          success,
          duration
        });
      } catch (error) {
        const duration = performance.now() - startTime;
        results.push({
          actionId: action.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration
        });
      }
    }

    // Ejecutar hooks
    this.executeHooks(event);

    // Registrar en historial
    this.recordExecution(event, results);

    return results;
  }

  /**
   * Ejecutar acción según su tipo
   */
  private executeActionByType(action: CompletionAction, event: CompletionEvent): boolean {
    switch (action.type) {
      case 'log':
        console.log(`[Task Completed] ${event.taskDescription} (${event.taskId})`);
        return true;

      case 'archive':
        // Simular archivado
        return true;

      case 'notify':
        // Simular notificación
        return true;

      case 'webhook':
        // Simular webhook
        return true;

      case 'custom':
        // Ejecutar función personalizada
        if (action.config?.fn && typeof action.config.fn === 'function') {
          action.config.fn(event);
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Registrar hook personalizado
   */
  registerHook(id: string, hook: Function): boolean {
    if (!id || !hook) {
      return false;
    }

    this.hooks.set(id, hook);
    return true;
  }

  /**
   * Desregistrar hook
   */
  unregisterHook(id: string): boolean {
    return this.hooks.delete(id);
  }

  /**
   * Ejecutar todos los hooks registrados
   */
  private executeHooks(event: CompletionEvent): void {
    for (const [, hook] of this.hooks) {
      try {
        hook(event);
      } catch (error) {
        // Silenciar errores de hooks
        console.error(`Hook error: ${error}`);
      }
    }
  }

  /**
   * Validar evento
   */
  validateEvent(event: any): boolean {
    if (!event || typeof event !== 'object') {
      return false;
    }

    if (!event.taskId || typeof event.taskId !== 'string') {
      return false;
    }

    if (!this.validStatuses.includes(event.previousStatus)) {
      return false;
    }

    if (!this.validStatuses.includes(event.newStatus)) {
      return false;
    }

    if (!event.timestamp || typeof event.timestamp !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Registrar ejecución en historial
   */
  private recordExecution(event: CompletionEvent, results: ActionResult[]): void {
    const record: ExecutionRecord = {
      timestamp: new Date().toISOString(),
      eventTaskId: event.taskId,
      results
    };

    this.executionHistory.push(record);

    // Limitar tamaño del historial
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Obtener historial de ejecuciones
   */
  getExecutionHistory(): ExecutionRecord[] {
    return [...this.executionHistory];
  }

  /**
   * Limpiar historial
   */
  clearExecutionHistory(): void {
    this.executionHistory = [];
  }
}

export default TaskCompletionHandler;
