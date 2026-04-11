/**
 * UC-047: SCHEDULED DATE
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que maneja scheduledDate: cuándo está agendada una tarea para trabajar en ella.
 * 
 * Diferencia crítica:
 * - dueDate: cuándo VENCE la tarea
 * - scheduledDate: cuándo EMPEZAR a trabajar en ella
 * 
 * Convención de nombres:
 * ✅ camelCase: schedulingManager, parseScheduledDate, validateScheduling
 * ✅ Archivo: schedulingManager.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface ScheduledTask {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  scheduledDate?: string;
  createdDate?: string;
  tags: string[];
}

interface SchedulingResult {
  success: boolean;
  task: ScheduledTask | null;
  previousScheduledDate?: string;
  newScheduledDate?: string;
  warnings?: string[];
  error?: string;
}

describe('UC-047: schedulingManager - Scheduled Date', () => {
  let manager: any;

  beforeEach(() => {
    const SchedulingManager = require('../../src/services/task-parser/schedulingManager').SchedulingManager;
    manager = new SchedulingManager();
  });

  // ==================== PARSING SCHEDULED DATE ====================
  describe('schedulingManager - Parse Scheduled Date', () => {
    test('debe parsear "⏳ 2026-05-15" a scheduledDate', () => {
      const line = '- [ ] Mi tarea ⏳ 2026-05-15';

      const result = manager.parseScheduledDateFromLine(line);

      expect(result.success).toBe(true);
      expect(result.scheduledDate).toBe('2026-05-15');
    });

    test('debe retornar null si no hay ⏳', () => {
      const line = '- [ ] Mi tarea sin scheduled date';

      const result = manager.parseScheduledDateFromLine(line);

      expect(result.success).toBe(true);
      expect(result.scheduledDate).toBeNull();
    });

    test('debe parsear fecha en formato YYYY-MM-DD', () => {
      const line = '- [ ] Tarea ⏳ 2026-04-15';

      const result = manager.parseScheduledDateFromLine(line);

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(result.scheduledDate).toMatch(dateRegex);
    });

    test('debe rechazar fecha inválida', () => {
      const line = '- [ ] Tarea ⏳ 2026-13-45'; // Mes y día inválidos

      const result = manager.parseScheduledDateFromLine(line);

      expect(result.success).toBe(false);
    });

    test('debe manejar múltiples emojis', () => {
      const line = '- [ ] Tarea 📅 2026-05-15 ⏫ ⏳ 2026-04-12';

      const result = manager.parseScheduledDateFromLine(line);

      expect(result.scheduledDate).toBe('2026-04-12');
    });
  });

  // ==================== SET SCHEDULED DATE ====================
  describe('schedulingManager - Set Scheduled Date', () => {
    test('debe establecer scheduledDate en task', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setScheduledDate(task, '2026-05-15');

      expect(result.success).toBe(true);
      expect(result.task?.scheduledDate).toBe('2026-05-15');
    });

    test('debe validar formato YYYY-MM-DD', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.setScheduledDate(task, '15-05-2026'); // Formato incorrecto

      expect(result.success).toBe(false);
    });

    test('debe permitir limpiar scheduledDate con null', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: '2026-05-15',
        tags: []
      };

      const result = manager.setScheduledDate(task, null);

      expect(result.success).toBe(true);
      expect(result.task?.scheduledDate).toBeUndefined();
    });
  });

  // ==================== VALIDACIONES DE SCHEDULING ====================
  describe('schedulingManager - Scheduling Validations', () => {
    test('debe validar que scheduledDate ≤ dueDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-05-10',
        scheduledDate: '2026-05-15', // Después de vencimiento!
        tags: []
      };

      const result = manager.validateScheduling(task);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain(expect.stringContaining('scheduledDate'));
    });

    test('debe permitir scheduledDate = dueDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-05-15',
        scheduledDate: '2026-05-15',
        tags: []
      };

      const result = manager.validateScheduling(task);

      expect(result.success).toBe(true);
    });

    test('debe validar que scheduledDate NO sea en el pasado', () => {
      const yesterdayString = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: yesterdayString,
        tags: []
      };

      const result = manager.validateScheduling(task);

      expect(result.success).toBe(false);
    });
  });

  // ==================== SMART SCHEDULING ====================
  describe('schedulingManager - Smart Scheduling', () => {
    test('debe ajustar scheduledDate si es mayor que dueDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-05-10',
        scheduledDate: '2026-05-15',
        tags: []
      };

      const result = manager.smartSchedule(task);

      expect(result.success).toBe(true);
      expect(result.task?.scheduledDate).toBe('2026-05-10');
      expect(result.warnings).toContain(expect.stringContaining('ajust'));
    });

    test('debe mantener scheduledDate si es válido', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-05-15',
        scheduledDate: '2026-05-10',
        tags: []
      };

      const result = manager.smartSchedule(task);

      expect(result.success).toBe(true);
      expect(result.task?.scheduledDate).toBe('2026-05-10');
      expect(result.warnings?.length).toBe(0);
    });

    test('debe NO modificar si no hay dueDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: '2026-05-15',
        tags: []
      };

      const result = manager.smartSchedule(task);

      expect(result.task?.scheduledDate).toBe('2026-05-15');
    });
  });

  // ==================== TAREAS PARA HOY ====================
  describe('schedulingManager - Today Tasks', () => {
    test('debe identificar tareas agendadas para hoy', () => {
      const today = new Date().toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea para hoy',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: today,
        tags: []
      };

      const result = manager.isScheduledForToday(task);

      expect(result).toBe(true);
    });

    test('debe NO identificar tareas de mañana como hoy', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea para mañana',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: tomorrow,
        tags: []
      };

      const result = manager.isScheduledForToday(task);

      expect(result).toBe(false);
    });

    test('debe retornar false si no hay scheduledDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea sin schedule',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.isScheduledForToday(task);

      expect(result).toBe(false);
    });
  });

  // ==================== TAREAS PENDIENTES ====================
  describe('schedulingManager - Overdue Tasks', () => {
    test('debe identificar tareas vencidas', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea vencida',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: yesterday,
        tags: []
      };

      const result = manager.isOverdue(task);

      expect(result).toBe(true);
    });

    test('debe NO identificar tarea con dueDate hoy como vencida', () => {
      const today = new Date().toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea con vencimiento hoy',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: today,
        tags: []
      };

      const result = manager.isOverdue(task);

      expect(result).toBe(false);
    });

    test('debe retornar false si no hay dueDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea sin due',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.isOverdue(task);

      expect(result).toBe(false);
    });
  });

  // ==================== RESCHEDULE ====================
  describe('schedulingManager - Reschedule', () => {
    test('debe posponer tarea +1 día', () => {
      const today = new Date().toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: today,
        tags: []
      };

      const result = manager.reschedule(task, 1); // +1 día

      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      expect(result.task?.scheduledDate).toBe(tomorrow);
    });

    test('debe posponer tarea +1 semana', () => {
      const today = new Date().toISOString().split('T')[0];

      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: today,
        tags: []
      };

      const result = manager.reschedule(task, 7); // +1 semana

      const nextWeek = new Date(Date.now() + 604800000).toISOString().split('T')[0];
      expect(result.task?.scheduledDate).toBe(nextWeek);
    });

    test('debe permitir posponer tareas sin scheduledDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.reschedule(task, 1);

      expect(result.success).toBe(true);
      expect(result.task?.scheduledDate).toBeDefined();
    });
  });

  // ==================== INTEGRACIÓN ====================
  describe('schedulingManager - Integration', () => {
    test('debe integrar con parseTaskFromLine', () => {
      const line = '- [ ] Tarea ⏳ 2026-05-15';

      const parseResult = manager.parseScheduledDateFromLine(line);
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: parseResult.scheduledDate || undefined,
        tags: []
      };

      expect(task.scheduledDate).toBe('2026-05-15');
    });

    test('debe integrar con autoDateManager', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea',
        status: 'TODO',
        priority: 'MEDIA',
        createdDate: '2026-04-01T10:00:00Z',
        scheduledDate: '2026-05-15',
        dueDate: '2026-05-20',
        tags: []
      };

      const result = manager.validateScheduling(task);

      expect(result.success).toBe(true);
      expect(task.createdDate).toBeDefined();
    });
  });

  // ==================== FILTERING ====================
  describe('schedulingManager - Filtering', () => {
    test('debe filtrar tareas agendadas para hoy', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const tasks: ScheduledTask[] = [
        {
          id: 'task-1',
          description: 'Hoy',
          status: 'TODO',
          priority: 'MEDIA',
          scheduledDate: today,
          tags: []
        },
        {
          id: 'task-2',
          description: 'Mañana',
          status: 'TODO',
          priority: 'MEDIA',
          scheduledDate: tomorrow,
          tags: []
        }
      ];

      const result = manager.filterByScheduledDate(tasks, 'today');

      expect(result.tasks.length).toBe(1);
      expect(result.tasks[0].id).toBe('task-1');
    });

    test('debe filtrar tareas agendadas esta semana', () => {
      const today = new Date();
      const tasks: ScheduledTask[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0];
        tasks.push({
          id: `task-${i}`,
          description: `Día ${i}`,
          status: 'TODO',
          priority: 'MEDIA',
          scheduledDate: date,
          tags: []
        });
      }

      const nextMonth = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];
      tasks.push({
        id: 'task-next-month',
        description: 'Próximo mes',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: nextMonth,
        tags: []
      });

      const result = manager.filterByScheduledDate(tasks, 'week');

      expect(result.tasks.length).toBe(7);
    });
  });

  // ==================== EDGE CASES ====================
  describe('schedulingManager - Edge Cases', () => {
    test('debe manejar task null', () => {
      const result = manager.setScheduledDate(null, '2026-05-15');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe mantener otras propiedades al cambiar scheduledDate', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Original',
        status: 'IN_PROGRESS',
        priority: 'ALTA',
        dueDate: '2026-05-20',
        createdDate: '2026-04-01T10:00:00Z',
        tags: ['work', 'urgent']
      };

      const result = manager.setScheduledDate(task, '2026-05-15');

      expect(result.task?.description).toBe('Original');
      expect(result.task?.status).toBe('IN_PROGRESS');
      expect(result.task?.priority).toBe('ALTA');
      expect(result.task?.dueDate).toBe('2026-05-20');
      expect(result.task?.tags).toEqual(['work', 'urgent']);
    });

    test('debe manejar dates muy alejadas en el futuro', () => {
      const task: ScheduledTask = {
        id: 'task-1',
        description: 'Tarea futura',
        status: 'TODO',
        priority: 'MEDIA',
        scheduledDate: '2050-12-31',
        tags: []
      };

      const result = manager.validateScheduling(task);

      expect(result.success).toBe(true);
    });
  });
});
