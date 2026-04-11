/**
 * Tests para UC-012: Create Task (TIER 1 MVP)
 */

import { TaskService, CreateTaskInput, TaskResult } from '../../src/services/createTask';

describe('UC-012: Create Task (TIER 1 MVP)', () => {
  
  describe('createTask', () => {
    it('debe crear tarea correctamente', async () => {
      const input: CreateTaskInput = {
        taskName: 'Mi Tarea',
        description: 'Descripción',
        priority: 'MEDIA'
      };

      const result = await TaskService.createTask(input);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^TSK-\d{6}-[A-Z0-9]{5}$/);
    });

    it('debe validar que taskName no esté vacío', async () => {
      const input: CreateTaskInput = {
        taskName: '',
        description: 'Test'
      };

      await expect(TaskService.createTask(input)).rejects.toThrow();
    });

    it('debe permitir description vacía', async () => {
      const input: CreateTaskInput = {
        taskName: 'Tarea Sin Desc',
        description: ''
      };

      const result = await TaskService.createTask(input);
      expect(result.success).toBe(true);
    });

    it('debe validar priority si se proporciona', async () => {
      const input: CreateTaskInput = {
        taskName: 'Test',
        description: 'Test',
        priority: 'ALTA'
      };

      const result = await TaskService.createTask(input);
      expect(result.success).toBe(true);
    });

    it('debe rechazar priority inválida', async () => {
      const input: CreateTaskInput = {
        taskName: 'Test',
        description: 'Test',
        priority: 'INVALIDA'
      };

      await expect(TaskService.createTask(input)).rejects.toThrow();
    });

    it('debe crear nota de tarea', async () => {
      const input: CreateTaskInput = {
        taskName: 'Nota Test',
        description: 'Test'
      };

      const result = await TaskService.createTask(input);

      expect(result.noteCreated).toBe(true);
      expect(result.notePath).toBeDefined();
    });

    it('debe crear frontmatter completo', async () => {
      const input: CreateTaskInput = {
        taskName: 'Frontmatter Test',
        description: 'Test',
        priority: 'ALTA'
      };

      const result = await TaskService.createTask(input);

      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter?.uid).toBe(result.taskId);
      expect(result.frontmatter?.type).toBe('tarea');
    });

    it('debe validar dueDate si se proporciona', async () => {
      const input: CreateTaskInput = {
        taskName: 'Due Date Test',
        description: 'Test',
        dueDate: '2026-04-20'
      };

      const result = await TaskService.createTask(input);
      expect(result.success).toBe(true);
    });

    it('debe retornar información completa', async () => {
      const input: CreateTaskInput = {
        taskName: 'Completo Test',
        description: 'Test'
      };

      const result = await TaskService.createTask(input);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('noteCreated');
      expect(result).toHaveProperty('frontmatter');
    });
  });

  describe('getTask', () => {
    it('debe obtener tarea por ID', async () => {
      const input: CreateTaskInput = {
        taskName: 'Get Test',
        description: 'Test'
      };

      const created = await TaskService.createTask(input);
      const result = await TaskService.getTask(created.taskId!);

      expect(result).toBeDefined();
      expect(result?.taskName).toBe('Get Test');
    });

    it('debe retornar null si tarea no existe', async () => {
      const result = await TaskService.getTask('TSK-999999-ZZZZZ');
      expect(result).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('debe listar tareas creadas', async () => {
      const input1: CreateTaskInput = {
        taskName: 'List Task 1',
        description: 'Test'
      };

      await TaskService.createTask(input1);

      const tasks = await TaskService.listTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('debe soportar múltiples prioridades', async () => {
      const priorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
      const results = [];

      for (const priority of priorities) {
        const input: CreateTaskInput = {
          taskName: `Priority ${priority}`,
          description: 'Test',
          priority
        };
        const result = await TaskService.createTask(input);
        results.push(result.success);
      }

      expect(results).toEqual([true, true, true, true]);
    });

    it('debe soportar caracteres especiales', async () => {
      const input: CreateTaskInput = {
        taskName: 'Tarea [Urgent] (2026)',
        description: 'Test'
      };

      const result = await TaskService.createTask(input);
      expect(result.success).toBe(true);
    });
  });

  describe('Integration: Complete Task Creation', () => {
    it('debe completar flujo end-to-end', async () => {
      const input: CreateTaskInput = {
        taskName: 'E2E Tarea',
        description: 'Test',
        priority: 'ALTA',
        dueDate: '2026-04-20'
      };

      const result = await TaskService.createTask(input);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.noteCreated).toBe(true);
      expect(result.frontmatter).toBeDefined();

      const retrieved = await TaskService.getTask(result.taskId!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.taskName).toBe('E2E Tarea');
    });
  });
});
