/**
 * UC-041: RECURRENCE
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que maneja tareas repetidas (recurrencias).
 * 
 * Ejemplos:
 * - "🔁 every day" - Diario
 * - "🔁 every weekday" - Lunes a viernes
 * - "🔁 every 2 weeks on Monday, Wednesday" - Biweekly
 * - "🔁 every month on the 15th" - Mensual
 * - "🔁 every year on January 1st" - Anual
 * 
 * Convención de nombres:
 * ✅ camelCase: recurrenceManager, parseRecurrence, expandInstances
 * ✅ Archivo: recurrenceManager.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface RecurrentTask {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  scheduledDate?: string;
  recurrence?: string;
  recurrenceRule?: string;
  tags: string[];
}

interface TaskInstance {
  originalId: string;
  instanceId: string;
  dueDate: string;
  scheduledDate?: string;
  occurrenceIndex: number;
}

interface RecurrenceResult {
  success: boolean;
  recurrenceRule?: string;
  frequency?: string;
  error?: string;
}

describe('UC-041: recurrenceManager - Recurrence', () => {
  let manager: any;

  beforeEach(() => {
    const RecurrenceManager = require('../../src/services/task-parser/recurrenceManager').RecurrenceManager;
    manager = new RecurrenceManager();
  });

  // ==================== PARSING RECURRENCE ====================
  describe('recurrenceManager - Parse Recurrence', () => {
    test('debe parsear "🔁 every day" a recurrence', () => {
      const line = '- [ ] Ejercicio 🔁 every day';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('DAILY');
    });

    test('debe parsear "🔁 every weekday"', () => {
      const line = '- [ ] Trabajo 🔁 every weekday';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('WEEKLY');
      expect(result.recurrenceRule).toContain('MO,TU,WE,TH,FR');
    });

    test('debe parsear "🔁 every week on Monday"', () => {
      const line = '- [ ] Reunión 🔁 every week on Monday';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('WEEKLY');
      expect(result.recurrenceRule).toContain('MO');
    });

    test('debe parsear "🔁 every 2 weeks"', () => {
      const line = '- [ ] Tarea 🔁 every 2 weeks';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('WEEKLY');
      expect(result.recurrenceRule).toContain('INTERVAL=2');
    });

    test('debe parsear "🔁 every month on the 15th"', () => {
      const line = '- [ ] Pago 🔁 every month on the 15th';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('MONTHLY');
      expect(result.recurrenceRule).toContain('15');
    });

    test('debe parsear "🔁 every year on January 1st"', () => {
      const line = '- [ ] Aniversario 🔁 every year on January 1st';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.frequency).toBe('YEARLY');
    });

    test('debe retornar null si no hay 🔁', () => {
      const line = '- [ ] Tarea sin recurrence';

      const result = manager.parseRecurrenceFromLine(line);

      expect(result.success).toBe(true);
      expect(result.recurrenceRule).toBeNull();
    });
  });

  // ==================== GENERAR INSTANCIAS ====================
  describe('recurrenceManager - Generate Instances', () => {
    test('debe generar instancias para "every day" por 30 días', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Ejercicio',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.expandInstances(task, 30);

      expect(result.success).toBe(true);
      expect(result.instances?.length).toBe(30);
    });

    test('debe generar instancias con IDs únicos', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.expandInstances(task, 3);

      expect(result.instances?.[0].instanceId).toMatch(/^task-1@\d{4}-\d{2}-\d{2}$/);
      expect(result.instances?.[0].instanceId).not.toBe(result.instances?.[1].instanceId);
    });

    test('debe generar instancias con dueDate correctas', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.expandInstances(task, 3);

      expect(result.instances?.[0].dueDate).toBe('2026-04-11');
      expect(result.instances?.[1].dueDate).toBe('2026-04-12');
      expect(result.instances?.[2].dueDate).toBe('2026-04-13');
    });

    test('debe respetar scheduledDate en instancias', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        scheduledDate: '2026-04-10',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.expandInstances(task, 2);

      expect(result.instances?.[0].scheduledDate).toBe('2026-04-10');
      expect(result.instances?.[1].scheduledDate).toBe('2026-04-11');
    });

    test('debe generar instancias para "every weekday" correctamente', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Trabajo',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-13', // Lunes
        recurrence: 'every weekday',
        tags: []
      };

      const result = manager.expandInstances(task, 10);

      expect(result.instances?.length).toBe(10);
      // Verificar que no incluye fines de semana
      const hasSaturday = result.instances?.some(i => {
        const date = new Date(i.dueDate);
        return date.getDay() === 6;
      });
      expect(hasSaturday).toBe(false);
    });
  });

  // ==================== SMART RESCHEDULING ====================
  describe('recurrenceManager - Smart Rescheduling', () => {
    test('debe detectar instancia pasada', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const instance: TaskInstance = {
        originalId: 'task-1',
        instanceId: 'task-1@' + yesterday,
        dueDate: yesterday,
        occurrenceIndex: 0
      };

      const result = manager.isOverdue(instance);

      expect(result).toBe(true);
    });

    test('debe NO marcar como pasada si es hoy', () => {
      const today = new Date().toISOString().split('T')[0];

      const instance: TaskInstance = {
        originalId: 'task-1',
        instanceId: 'task-1@' + today,
        dueDate: today,
        occurrenceIndex: 0
      };

      const result = manager.isOverdue(instance);

      expect(result).toBe(false);
    });

    test('debe auto-reschedule instancia pasada a hoy', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      const instance: TaskInstance = {
        originalId: 'task-1',
        instanceId: 'task-1@' + yesterday,
        dueDate: yesterday,
        occurrenceIndex: 0
      };

      const result = manager.smartReschedule(instance);

      expect(result.success).toBe(true);
      expect(result.instance?.dueDate).toBe(today);
    });
  });

  // ==================== VALIDACIONES ====================
  describe('recurrenceManager - Validations', () => {
    test('debe validar recurrence válida', () => {
      const rule = 'FREQ=DAILY';

      const result = manager.validateRecurrenceRule(rule);

      expect(result.valid).toBe(true);
    });

    test('debe rechazar recurrence inválida', () => {
      const rule = 'FREQ=INVALID';

      const result = manager.validateRecurrenceRule(rule);

      expect(result.valid).toBe(false);
    });

    test('debe permitir task sin recurrence', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Normal',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.validateRecurrentTask(task);

      expect(result.valid).toBe(true);
    });
  });

  // ==================== CREAR TASK RECURRENTE ====================
  describe('recurrenceManager - Create Recurrent Task', () => {
    test('debe crear task recurrente', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Ejercicio diario',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.createRecurrentTask(task);

      expect(result.success).toBe(true);
      expect(result.task?.recurrence).toBe('every day');
    });

    test('debe generar RRule automáticamente', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      const result = manager.createRecurrentTask(task);

      expect(result.task?.recurrenceRule).toBeDefined();
      expect(result.task?.recurrenceRule).toContain('FREQ=DAILY');
    });
  });

  // ==================== COMPLETAR INSTANCIA ====================
  describe('recurrenceManager - Complete Instance', () => {
    test('debe completar instancia sin afectar próxima', () => {
      const instance: TaskInstance = {
        originalId: 'task-1',
        instanceId: 'task-1@2026-04-11',
        dueDate: '2026-04-11',
        occurrenceIndex: 0
      };

      const result = manager.completeInstance(instance);

      expect(result.success).toBe(true);
      expect(result.nextInstance?.dueDate).not.toBe(instance.dueDate);
    });

    test('debe generar próxima instancia', () => {
      const instance: TaskInstance = {
        originalId: 'task-1',
        instanceId: 'task-1@2026-04-11',
        dueDate: '2026-04-11',
        occurrenceIndex: 0
      };

      const result = manager.completeInstance(instance);

      expect(result.nextInstance?.instanceId).toContain('task-1@');
      expect(result.nextInstance?.occurrenceIndex).toBe(1);
    });
  });

  // ==================== LISTADO DE INSTANCIAS ====================
  describe('recurrenceManager - List Instances', () => {
    test('debe listar instancias activas (no completadas)', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const instances: TaskInstance[] = [
        {
          originalId: 'task-1',
          instanceId: 'task-1@' + today,
          dueDate: today,
          occurrenceIndex: 0
        },
        {
          originalId: 'task-1',
          instanceId: 'task-1@' + tomorrow,
          dueDate: tomorrow,
          occurrenceIndex: 1
        }
      ];

      const result = manager.getActiveInstances(instances);

      expect(result.length).toBeGreaterThan(0);
    });

    test('debe filtrar instancias por rango de fechas', () => {
      const today = new Date();
      const instances: TaskInstance[] = [];

      for (let i = 0; i < 10; i++) {
        const date = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0];
        instances.push({
          originalId: 'task-1',
          instanceId: 'task-1@' + date,
          dueDate: date,
          occurrenceIndex: i
        });
      }

      const result = manager.filterInstancesByDateRange(
        instances,
        new Date().toISOString().split('T')[0],
        new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0]
      );

      expect(result.length).toBeLessThanOrEqual(4);
    });
  });

  // ==================== EDGE CASES ====================
  describe('recurrenceManager - Edge Cases', () => {
    test('debe manejar task null', () => {
      const result = manager.createRecurrentTask(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe manejar recurrence vacía', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        recurrence: '',
        tags: []
      };

      const result = manager.createRecurrentTask(task);

      expect(result.success).toBe(false);
    });

    test('debe mantener propiedades de task en instancias', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea importante',
        status: 'TODO',
        priority: 'ALTA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: ['work', 'urgent']
      };

      const result = manager.expandInstances(task, 1);

      // Las instancias deben mantener info de la tarea original
      expect(result.instances?.[0].originalId).toBe('task-1');
    });

    test('debe manejar máximo de instancias', () => {
      const task: RecurrentTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-04-11',
        recurrence: 'every day',
        tags: []
      };

      // No debe generar más de 365 instancias por año
      const result = manager.expandInstances(task, 1000);

      expect(result.instances?.length).toBeLessThanOrEqual(365);
    });
  });
});
