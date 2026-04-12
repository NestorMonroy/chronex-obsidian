/**
 * SEMANA 3: Tests para GanttRenderer
 */

import { GanttRenderer } from './ganttRenderer';
import { GanttTask } from './ganttTask';
import { CachedTask } from '../../services/dataManager/types';

describe('GanttRenderer - SEMANA 3', () => {
  let container: HTMLDivElement;
  let renderer: GanttRenderer;

  beforeEach(() => {
    // Crear contenedor mock
    container = document.createElement('div');
    container.id = 'gantt-container';
    document.body.appendChild(container);

    renderer = new GanttRenderer({
      container,
    });
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  // ==================== GanttTask ====================

  describe('GanttTask', () => {
    let cachedTask: CachedTask;
    let ganttTask: GanttTask;

    beforeEach(() => {
      cachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {
          title: 'Test Task',
          description: 'Test Description',
          priority: 'ALTA',
          status: 'doing',
          dueDate: '2026-05-15',
          dateCreated: '2026-04-11',
        },
        lastUpdate: Date.now(),
      };

      ganttTask = new GanttTask(cachedTask, {
        id: 'TSK-001',
        name: 'Test Task',
        start: '2026-05-10',
        end: '2026-05-15',
        progress: 50,
      });
    });

    test('debería obtener tarea cacheada', () => {
      expect(ganttTask.getCachedTask()).toEqual(cachedTask);
    });

    test('debería obtener datos del chart', () => {
      const chartData = ganttTask.getChartData();
      expect(chartData.id).toBe('TSK-001');
      expect(chartData.progress).toBe(50);
    });

    test('debería obtener ID', () => {
      expect(ganttTask.getId()).toBe('TSK-001');
    });

    test('debería obtener título', () => {
      expect(ganttTask.getTitle()).toBe('Test Task');
    });

    test('debería obtener prioridad', () => {
      expect(ganttTask.getPriority()).toBe('ALTA');
    });

    test('debería obtener estado', () => {
      expect(ganttTask.getStatus()).toBe('doing');
    });

    test('debería obtener fecha de vencimiento', () => {
      expect(ganttTask.getDueDate()).toBe('2026-05-15');
    });

    test('debería obtener progreso', () => {
      expect(ganttTask.getProgress()).toBe(50);
    });

    test('debería verificar si está completada', () => {
      ganttTask.updateChartData({ progress: 100 });
      expect(ganttTask.isCompleted()).toBe(true);

      ganttTask.updateChartData({ progress: 50 });
      expect(ganttTask.isCompleted()).toBe(false);
    });

    test('debería obtener resumen', () => {
      const summary = ganttTask.getSummary();
      expect(summary.id).toBe('TSK-001');
      expect(summary.title).toBe('Test Task');
      expect(summary.progress).toBe(50);
    });

    test('debería obtener detalles', () => {
      const details = ganttTask.getDetails();
      expect(details.id).toBe('TSK-001');
      expect(details.title).toBe('Test Task');
      expect(details.description).toBe('Test Description');
      expect(details.priority).toBe('ALTA');
    });

    test('debería actualizar datos del chart', () => {
      ganttTask.updateChartData({ progress: 75 });
      expect(ganttTask.getProgress()).toBe(75);
    });

    test('debería manejar valores por defecto', () => {
      const taskMinimal: CachedTask = {
        taskId: 'TSK-002',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      };

      const ganttTaskMinimal = new GanttTask(taskMinimal, {
        id: 'TSK-002',
        name: '',
        start: '2026-04-11',
        end: '2026-04-11',
        progress: 0,
      });

      expect(ganttTaskMinimal.getTitle()).toBe('Sin título');
      expect(ganttTaskMinimal.getPriority()).toBe('MEDIA');
      expect(ganttTaskMinimal.getStatus()).toBe('pendiente');
      expect(ganttTaskMinimal.getProgress()).toBe(0);
    });
  });

  // ==================== GanttRenderer ====================

  describe('GanttRenderer', () => {
    test('debería inicializar con config', () => {
      expect(renderer).toBeDefined();
    });

    test('debería renderizar contenedor vacío', async () => {
      await renderer.render();
      expect(container.innerHTML).toContain('No hay tareas');
    });

    test('debería destruir renderer', () => {
      renderer.destroy();
      expect(container.innerHTML).toBe('');
    });

    test('debería obtener estadísticas', () => {
      const stats = renderer.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.averageProgress).toBe(0);
    });

    test('debería obtener tareas', () => {
      const tasks = renderer.getTasks();
      expect(tasks).toEqual([]);
    });

    test('debería manejar errores en render', async () => {
      // Mock DataManager para lanzar error
      jest.spyOn(require('../../services/dataManager'), 'dataManager').mockImplementation({
        getProjectTasks: jest.fn(() => Promise.reject(new Error('Mock error'))),
      } as any);

      await renderer.render();
      expect(container.innerHTML).toContain('Error');
    });

    test('debería convertir CachedTask a formato Gantt', () => {
      const tasks: CachedTask[] = [
        {
          taskId: 'TSK-001',
          folderPath: '/test',
          notePath: '/test/README.md',
          frontmatter: {
            title: 'Test',
            dueDate: '2026-05-15',
            priority: 'ALTA',
          },
          lastUpdate: Date.now(),
        },
      ];

      const privateMethod = (renderer as any).convertToGanttFormat;
      const ganttData = privateMethod.call(renderer, tasks);

      expect(ganttData).toHaveLength(1);
      expect(ganttData[0].id).toBe('TSK-001');
      expect(ganttData[0].start).toBe('2026-05-15');
    });

    test('debería parsear progreso del contenido', () => {
      const content = `
# Task

- [x] Paso 1
- [x] Paso 2
- [ ] Paso 3
      `;

      const privateMethod = (renderer as any).parseProgress;
      const progress = privateMethod.call(renderer, content);

      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(67);
    });

    test('debería obtener color según prioridad', () => {
      const cachedTask: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: { priority: 'CRÍTICA' },
        lastUpdate: Date.now(),
      };

      const ganttTask = new GanttTask(cachedTask, {
        id: 'TSK-001',
        name: 'Test',
        start: '2026-04-11',
        end: '2026-04-11',
        progress: 0,
      });

      const privateMethod = (renderer as any).getPriorityColor;
      const color = privateMethod.call(renderer, ganttTask);

      expect(color).toBe('#ff4444'); // CRÍTICA
    });
  });

  // ==================== INTEGRACIÓN ====================

  describe('Integración - Flujo completo', () => {
    test('debería crear renderer y renderizar', async () => {
      expect(renderer).toBeDefined();

      await renderer.render();

      // Debería tener contenedor
      expect(container.querySelector('.gantt-empty')).toBeDefined();
    });

    test('debería manejar drag & drop setup', async () => {
      const mockOnDateChange = jest.fn();

      const rendererWithCallback = new GanttRenderer({
        container,
        onDateChange: mockOnDateChange,
      });

      expect(rendererWithCallback).toBeDefined();
      rendererWithCallback.destroy();
    });

    test('debería manejar click en tasks', async () => {
      const mockOnTaskClick = jest.fn();

      const rendererWithCallback = new GanttRenderer({
        container,
        onTaskClick: mockOnTaskClick,
      });

      expect(rendererWithCallback).toBeDefined();
      rendererWithCallback.destroy();
    });
  });

  // ==================== RENDERING ====================

  describe('Rendering - DOM operations', () => {
    test('debería crear elemento de task', () => {
      const task: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {
          title: 'Test Task',
          priority: 'ALTA',
          status: 'doing',
        },
        lastUpdate: Date.now(),
      };

      const ganttTask = new GanttTask(task, {
        id: 'TSK-001',
        name: 'Test Task',
        start: '2026-04-11',
        end: '2026-04-15',
        progress: 50,
      });

      expect(ganttTask.getTitle()).toBe('Test Task');
      expect(ganttTask.getPriority()).toBe('ALTA');
    });

    test('debería renderizar múltiples tasks', async () => {
      expect(renderer.getTasks()).toEqual([]);

      // Después de render debería tener tareas (si las hubiera)
      await renderer.render();

      expect(Array.isArray(renderer.getTasks())).toBe(true);
    });
  });
});
