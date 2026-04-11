/**
 * UC-045: ACCIONES COMPLETAR
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que ejecuta acciones cuando una tarea se completa.
 * Events, hooks, callbacks para automatizar workflows.
 * 
 * Convención de nombres:
 * ✅ camelCase: taskCompletionHandler, registerHook, executeActions
 * ✅ Archivo: taskCompletionHandler.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface CompletionAction {
  id: string;
  type: 'log' | 'archive' | 'notify' | 'webhook' | 'custom';
  enabled: boolean;
  config?: any;
  priority?: number;
}

interface CompletionEvent {
  taskId: string;
  taskDescription: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  metadata?: any;
}

interface ActionResult {
  actionId: string;
  success: boolean;
  error?: string;
  duration: number;
}

describe('UC-045: taskCompletionHandler - Acciones Completar', () => {
  let handler: any;

  beforeEach(() => {
    const TaskCompletionHandler = require('../../src/services/task-parser/taskCompletionHandler').TaskCompletionHandler;
    handler = new TaskCompletionHandler();
  });

  // ==================== REGISTRO DE ACCIONES ====================
  describe('taskCompletionHandler - Registro de acciones', () => {
    test('debe registrar una acción completar', () => {
      const action: CompletionAction = {
        id: 'log-complete',
        type: 'log',
        enabled: true
      };
      
      const registered = handler.registerAction(action);
      
      expect(registered).toBe(true);
      expect(handler.getAction('log-complete')).toEqual(action);
    });

    test('debe rechazar acción sin id', () => {
      const action: any = {
        type: 'log',
        enabled: true
      };
      
      const registered = handler.registerAction(action);
      
      expect(registered).toBe(false);
    });

    test('debe rechazar acción sin type', () => {
      const action: any = {
        id: 'test',
        enabled: true
      };
      
      const registered = handler.registerAction(action);
      
      expect(registered).toBe(false);
    });

    test('debe rechazar acción duplicada', () => {
      const action: CompletionAction = {
        id: 'unique-action',
        type: 'log',
        enabled: true
      };
      
      handler.registerAction(action);
      const result = handler.registerAction(action);
      
      expect(result).toBe(false);
    });

    test('debe obtener todas las acciones', () => {
      const action1: CompletionAction = { id: 'action1', type: 'log', enabled: true };
      const action2: CompletionAction = { id: 'action2', type: 'archive', enabled: true };
      
      handler.registerAction(action1);
      handler.registerAction(action2);
      
      const all = handler.getAllActions();
      
      expect(all).toHaveLength(2);
      expect(all.map((a: any) => a.id)).toContain('action1');
      expect(all.map((a: any) => a.id)).toContain('action2');
    });
  });

  // ==================== EJECUTAR ACCIONES ====================
  describe('taskCompletionHandler - Ejecutar acciones', () => {
    test('debe ejecutar acción cuando tarea se completa', () => {
      const action: CompletionAction = {
        id: 'log-complete',
        type: 'log',
        enabled: true
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Mi tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    test('debe ejecutar múltiples acciones', () => {
      const action1: CompletionAction = { id: 'log', type: 'log', enabled: true };
      const action2: CompletionAction = { id: 'archive', type: 'archive', enabled: true };
      
      handler.registerAction(action1);
      handler.registerAction(action2);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('debe respetar prioridad de acciones', () => {
      const action1: CompletionAction = { id: 'first', type: 'log', enabled: true, priority: 1 };
      const action2: CompletionAction = { id: 'second', type: 'log', enabled: true, priority: 2 };
      const action3: CompletionAction = { id: 'third', type: 'log', enabled: true, priority: 0 };
      
      handler.registerAction(action1);
      handler.registerAction(action2);
      handler.registerAction(action3);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      // Deberían ejecutarse en orden de prioridad
      expect(results[0].actionId).toBe('third');
      expect(results[1].actionId).toBe('first');
      expect(results[2].actionId).toBe('second');
    });

    test('debe saltar acciones deshabilitadas', () => {
      const action1: CompletionAction = { id: 'enabled', type: 'log', enabled: true };
      const action2: CompletionAction = { id: 'disabled', type: 'log', enabled: false };
      
      handler.registerAction(action1);
      handler.registerAction(action2);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      // Solo la habilitada debería ejecutarse
      expect(results.some((r: any) => r.actionId === 'disabled')).toBe(false);
    });
  });

  // ==================== REGISTRAR HOOKS ====================
  describe('taskCompletionHandler - Registrar hooks', () => {
    test('debe registrar hook personalizado', () => {
      const hook = jest.fn((event: CompletionEvent) => {
        return { success: true };
      });
      
      handler.registerHook('custom-hook', hook);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      handler.executeActionsOnCompletion(event);
      
      expect(hook).toHaveBeenCalled();
    });

    test('debe registrar múltiples hooks', () => {
      const hook1 = jest.fn();
      const hook2 = jest.fn();
      
      handler.registerHook('hook1', hook1);
      handler.registerHook('hook2', hook2);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      handler.executeActionsOnCompletion(event);
      
      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    test('debe desregistrar hook', () => {
      const hook = jest.fn();
      
      handler.registerHook('test-hook', hook);
      handler.unregisterHook('test-hook');
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      handler.executeActionsOnCompletion(event);
      
      expect(hook).not.toHaveBeenCalled();
    });
  });

  // ==================== TIPOS DE ACCIONES ====================
  describe('taskCompletionHandler - Tipos de acciones', () => {
    test('debe soportar acción type: log', () => {
      const action: CompletionAction = {
        id: 'log-action',
        type: 'log',
        enabled: true,
        config: { level: 'info' }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea completada',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'log-action' && r.success)).toBe(true);
    });

    test('debe soportar acción type: archive', () => {
      const action: CompletionAction = {
        id: 'archive-action',
        type: 'archive',
        enabled: true,
        config: { destination: 'archive' }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'archive-action')).toBe(true);
    });

    test('debe soportar acción type: notify', () => {
      const action: CompletionAction = {
        id: 'notify-action',
        type: 'notify',
        enabled: true,
        config: { channels: ['email', 'slack'] }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'notify-action')).toBe(true);
    });

    test('debe soportar acción type: webhook', () => {
      const action: CompletionAction = {
        id: 'webhook-action',
        type: 'webhook',
        enabled: true,
        config: { url: 'https://example.com/webhook' }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'webhook-action')).toBe(true);
    });

    test('debe soportar acción type: custom', () => {
      const action: CompletionAction = {
        id: 'custom-action',
        type: 'custom',
        enabled: true,
        config: { fn: 'myCustomFunction' }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'custom-action')).toBe(true);
    });
  });

  // ==================== VALIDACIÓN ====================
  describe('taskCompletionHandler - Validación', () => {
    test('debe validar evento válido', () => {
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const valid = handler.validateEvent(event);
      
      expect(valid).toBe(true);
    });

    test('debe rechazar evento sin taskId', () => {
      const event: any = {
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const valid = handler.validateEvent(event);
      
      expect(valid).toBe(false);
    });

    test('debe rechazar evento con status inválido', () => {
      const event: any = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'INVALID',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const valid = handler.validateEvent(event);
      
      expect(valid).toBe(false);
    });
  });

  // ==================== HISTORIAL ====================
  describe('taskCompletionHandler - Historial de ejecuciones', () => {
    test('debe registrar historial de ejecuciones', () => {
      const action: CompletionAction = {
        id: 'tracked-action',
        type: 'log',
        enabled: true
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      handler.executeActionsOnCompletion(event);
      
      const history = handler.getExecutionHistory();
      
      expect(history.length).toBeGreaterThan(0);
    });

    test('debe incluir información de duración en historial', () => {
      const action: CompletionAction = {
        id: 'timed-action',
        type: 'log',
        enabled: true
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results[0].duration).toBeDefined();
      expect(results[0].duration).toBeGreaterThanOrEqual(0);
    });

    test('debe limpiar historial cuando se solicita', () => {
      const action: CompletionAction = {
        id: 'action',
        type: 'log',
        enabled: true
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      handler.executeActionsOnCompletion(event);
      
      handler.clearExecutionHistory();
      
      expect(handler.getExecutionHistory().length).toBe(0);
    });
  });

  // ==================== CONDICIONALES ====================
  describe('taskCompletionHandler - Acciones condicionales', () => {
    test('debe ejecutar acción si condition es true', () => {
      const action: CompletionAction = {
        id: 'conditional-action',
        type: 'log',
        enabled: true,
        config: {
          condition: (event: CompletionEvent) => event.newStatus === 'DONE'
        }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'conditional-action' && r.success)).toBe(true);
    });

    test('debe saltar acción si condition es false', () => {
      const action: CompletionAction = {
        id: 'conditional-skip',
        type: 'log',
        enabled: true,
        config: {
          condition: (event: CompletionEvent) => event.newStatus === 'ARCHIVED'
        }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      expect(results.some((r: any) => r.actionId === 'conditional-skip')).toBe(false);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('taskCompletionHandler - Manejo de errores', () => {
    test('debe capturar error y retornar resultado', () => {
      const action: CompletionAction = {
        id: 'error-action',
        type: 'webhook',
        enabled: true,
        config: { url: 'invalid-url' }
      };
      
      handler.registerAction(action);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      // Debería haber resultado aunque haya error
      expect(results.some((r: any) => r.actionId === 'error-action')).toBe(true);
    });

    test('debe continuar con siguientes acciones si una falla', () => {
      const action1: CompletionAction = { id: 'fail-action', type: 'webhook', enabled: true, config: { url: 'bad' } };
      const action2: CompletionAction = { id: 'ok-action', type: 'log', enabled: true };
      
      handler.registerAction(action1);
      handler.registerAction(action2);
      
      const event: CompletionEvent = {
        taskId: 'task-1',
        taskDescription: 'Tarea',
        previousStatus: 'TODO',
        newStatus: 'DONE',
        timestamp: new Date().toISOString()
      };
      
      const results = handler.executeActionsOnCompletion(event);
      
      // Ambas deberían tener resultado
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });
});
