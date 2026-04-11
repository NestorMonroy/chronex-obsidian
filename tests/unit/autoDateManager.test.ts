/**
 * UC-046: AUTO DATES
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que automáticamente registra fechas clave:
 * - createdDate: cuando se crea la tarea
 * - doneDate: cuando se completa (status = DONE)
 * - cancelledDate: cuando se cancela (status = CANCELLED)
 * 
 * Convención de nombres:
 * ✅ camelCase: autoDateManager, setCreatedDate, setDoneDate
 * ✅ Archivo: autoDateManager.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface Task {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  createdDate?: string;
  doneDate?: string;
  cancelledDate?: string;
  tags: string[];
  blockLink?: string;
}

interface DateChangeResult {
  success: boolean;
  task: Task | null;
  previousDates?: {
    createdDate?: string;
    doneDate?: string;
    cancelledDate?: string;
  };
  newDates?: {
    createdDate?: string;
    doneDate?: string;
    cancelledDate?: string;
  };
  error?: string;
}

describe('UC-046: autoDateManager - Auto Dates', () => {
  let manager: any;

  beforeEach(() => {
    const AutoDateManager = require('../../src/services/task-parser/autoDateManager').AutoDateManager;
    manager = new AutoDateManager();
  });

  // ==================== CREATED DATE ====================
  describe('autoDateManager - Created Date', () => {
    test('debe establecer createdDate cuando se crea tarea', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Nueva tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setCreatedDate(task);

      expect(result.success).toBe(true);
      expect(result.task?.createdDate).toBeDefined();
      expect(result.newDates?.createdDate).toBeDefined();
    });

    test('debe establecer createdDate con formato ISO 8601', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setCreatedDate(task);

      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(result.task?.createdDate).toMatch(dateRegex);
    });

    test('debe NO sobrescribir createdDate si ya existe', () => {
      const existingDate = '2026-04-01T10:00:00Z';
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        createdDate: existingDate,
        tags: []
      };

      const result = manager.setCreatedDate(task);

      expect(result.task?.createdDate).toBe(existingDate);
      expect(result.previousDates?.createdDate).toBe(existingDate);
    });

    test('debe retornar timestamp muy cercano al ahora', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const beforeCall = new Date();
      const result = manager.setCreatedDate(task);
      const afterCall = new Date();

      const createdDate = new Date(result.task?.createdDate!);

      expect(createdDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 100);
      expect(createdDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 100);
    });
  });

  // ==================== DONE DATE ====================
  describe('autoDateManager - Done Date', () => {
    test('debe establecer doneDate cuando status cambia a DONE', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Completar',
        status: 'DONE',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setDoneDate(task);

      expect(result.success).toBe(true);
      expect(result.task?.doneDate).toBeDefined();
      expect(result.newDates?.doneDate).toBeDefined();
    });

    test('debe usar timestamp actual para doneDate', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        tags: []
      };

      const beforeCall = new Date();
      const result = manager.setDoneDate(task);
      const afterCall = new Date();

      const doneDate = new Date(result.task?.doneDate!);

      expect(doneDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 100);
      expect(doneDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 100);
    });

    test('debe NO sobrescribir doneDate si ya existe', () => {
      const existingDoneDate = '2026-04-05T14:00:00Z';
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        doneDate: existingDoneDate,
        tags: []
      };

      const result = manager.setDoneDate(task);

      expect(result.task?.doneDate).toBe(existingDoneDate);
    });

    test('debe NO establecer doneDate si status NO es DONE', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setDoneDate(task);

      expect(result.task?.doneDate).toBeUndefined();
    });

    test('debe limpiar doneDate si tarea se vuelve NOT DONE', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        doneDate: '2026-04-05T14:00:00Z',
        tags: []
      };

      const result = manager.clearDoneDate(task);

      expect(result.task?.doneDate).toBeUndefined();
    });
  });

  // ==================== CANCELLED DATE ====================
  describe('autoDateManager - Cancelled Date', () => {
    test('debe establecer cancelledDate cuando status = CANCELLED', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Cancelar',
        status: 'CANCELLED',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setCancelledDate(task);

      expect(result.success).toBe(true);
      expect(result.task?.cancelledDate).toBeDefined();
      expect(result.newDates?.cancelledDate).toBeDefined();
    });

    test('debe usar timestamp actual para cancelledDate', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'CANCELLED',
        priority: 'MEDIA',
        tags: []
      };

      const beforeCall = new Date();
      const result = manager.setCancelledDate(task);
      const afterCall = new Date();

      const cancelledDate = new Date(result.task?.cancelledDate!);

      expect(cancelledDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 100);
      expect(cancelledDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 100);
    });

    test('debe NO sobrescribir cancelledDate si ya existe', () => {
      const existingCancelledDate = '2026-04-06T09:00:00Z';
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'CANCELLED',
        priority: 'MEDIA',
        cancelledDate: existingCancelledDate,
        tags: []
      };

      const result = manager.setCancelledDate(task);

      expect(result.task?.cancelledDate).toBe(existingCancelledDate);
    });

    test('debe limpiar cancelledDate si tarea se vuelve NOT CANCELLED', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        cancelledDate: '2026-04-06T09:00:00Z',
        tags: []
      };

      const result = manager.clearCancelledDate(task);

      expect(result.task?.cancelledDate).toBeUndefined();
    });
  });

  // ==================== STATUS TRANSITIONS ====================
  describe('autoDateManager - Status Transitions', () => {
    test('debe manejar transición TODO → DONE → TODO', () => {
      let task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      // TODO → DONE
      let result = manager.setDoneDate({ ...task, status: 'DONE' });
      task = result.task!;

      expect(task.doneDate).toBeDefined();

      // DONE → TODO (limpiar doneDate)
      result = manager.clearDoneDate({ ...task, status: 'TODO' });
      task = result.task!;

      expect(task.doneDate).toBeUndefined();
    });

    test('debe manejar transición DONE → CANCELLED', () => {
      let task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        doneDate: '2026-04-05T14:00:00Z',
        tags: []
      };

      // DONE → CANCELLED (agregar cancelledDate, mantener doneDate)
      const result = manager.setCancelledDate({ ...task, status: 'CANCELLED' });
      task = result.task!;

      expect(task.doneDate).toBeDefined();
      expect(task.cancelledDate).toBeDefined();
    });

    test('debe manejar múltiples transiciones de estado', () => {
      let task: Task = {
        id: 'task-1',
        description: 'Tarea compleja',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const transitions = [
        { status: 'IN_PROGRESS' as const, expectedDone: false },
        { status: 'DONE' as const, expectedDone: true },
        { status: 'TODO' as const, expectedDone: false },
        { status: 'CANCELLED' as const, expectedDone: false }
      ];

      for (const transition of transitions) {
        if (transition.status === 'DONE') {
          const result = manager.setDoneDate({ ...task, status: transition.status });
          task = result.task!;
        } else if (transition.status === 'CANCELLED') {
          const result = manager.setCancelledDate({ ...task, status: transition.status });
          task = result.task!;
        } else {
          task = { ...task, status: transition.status };
          if (transition.status === 'TODO') {
            const result = manager.clearDoneDate(task);
            task = result.task!;
          }
        }

        if (transition.expectedDone) {
          expect(task.doneDate).toBeDefined();
        }
      }
    });
  });

  // ==================== APLICAR AUTO DATES A TAREA COMPLETA ====================
  describe('autoDateManager - Auto apply to full task', () => {
    test('debe aplicar automáticamente createdDate al crear', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Nueva',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.applyAutoDatesOnCreate(task);

      expect(result.task?.createdDate).toBeDefined();
      expect(result.task?.doneDate).toBeUndefined();
      expect(result.task?.cancelledDate).toBeUndefined();
    });

    test('debe aplicar doneDate cuando se completa', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        createdDate: '2026-04-01T10:00:00Z',
        tags: []
      };

      const result = manager.applyAutoDatesOnStatusChange(task, 'TODO');

      expect(result.task?.doneDate).toBeDefined();
      expect(result.task?.createdDate).toBe('2026-04-01T10:00:00Z');
    });

    test('debe aplicar cancelledDate cuando se cancela', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'CANCELLED',
        priority: 'MEDIA',
        createdDate: '2026-04-01T10:00:00Z',
        tags: []
      };

      const result = manager.applyAutoDatesOnStatusChange(task, 'TODO');

      expect(result.task?.cancelledDate).toBeDefined();
      expect(result.task?.createdDate).toBe('2026-04-01T10:00:00Z');
    });
  });

  // ==================== INTEGRACIÓN CON PARSEFLOW ====================
  describe('autoDateManager - Integration with parseFlow', () => {
    test('debe integrar con parseTaskFromLine', () => {
      const line = '- [ ] Mi tarea';
      const location = { path: 'inbox.md', lineNumber: 1 };

      const parseResult = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, location);
      const autoDateResult = manager.applyAutoDatesOnCreate(parseResult.task);

      expect(autoDateResult.task?.createdDate).toBeDefined();
    });

    test('debe integrar con taskCompletionHandler', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Completar',
        status: 'DONE',
        priority: 'MEDIA',
        createdDate: '2026-04-01T10:00:00Z',
        tags: []
      };

      const result = manager.applyAutoDatesOnStatusChange(task, 'TODO');

      expect(result.task?.doneDate).toBeDefined();
      expect(result.task?.createdDate).toBeDefined();
    });
  });

  // ==================== VALIDACIONES ====================
  describe('autoDateManager - Validations', () => {
    test('debe validar que createdDate ≤ doneDate', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        createdDate: '2026-04-10T10:00:00Z',
        doneDate: '2026-04-05T14:00:00Z', // Anterior a created!
        tags: []
      };

      const isValid = manager.validateTaskDates(task);

      expect(isValid).toBe(false);
    });

    test('debe validar que doneDate y cancelledDate no coexistan', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'DONE',
        priority: 'MEDIA',
        createdDate: '2026-04-01T10:00:00Z',
        doneDate: '2026-04-05T14:00:00Z',
        cancelledDate: '2026-04-06T09:00:00Z', // Ambas!
        tags: []
      };

      const isValid = manager.validateTaskDates(task);

      expect(isValid).toBe(false);
    });

    test('debe permitir task sin ninguna fecha auto', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const isValid = manager.validateTaskDates(task);

      expect(isValid).toBe(true);
    });
  });

  // ==================== EDGE CASES ====================
  describe('autoDateManager - Edge cases', () => {
    test('debe manejar tarea null/undefined', () => {
      const result = manager.setCreatedDate(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe mantener otras propiedades de task', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'ALTA',
        dueDate: '2026-05-15',
        tags: ['work', 'urgent'],
        blockLink: 'block-123'
      };

      const result = manager.setCreatedDate(task);

      expect(result.task?.description).toBe(task.description);
      expect(result.task?.priority).toBe(task.priority);
      expect(result.task?.dueDate).toBe(task.dueDate);
      expect(result.task?.tags).toEqual(task.tags);
      expect(result.task?.blockLink).toBe(task.blockLink);
    });

    test('debe preservar orden de operaciones', () => {
      let task: Task = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      // 1. Crear (agregar createdDate)
      let result = manager.applyAutoDatesOnCreate(task);
      task = result.task!;
      const createdDate = task.createdDate!;

      // 2. Completar (agregar doneDate)
      result = manager.applyAutoDatesOnStatusChange({ ...task, status: 'DONE' }, 'TODO');
      task = result.task!;

      // 3. Verificar que createdDate no cambió
      expect(task.createdDate).toBe(createdDate);
      expect(task.doneDate).toBeDefined();
    });
  });
});
