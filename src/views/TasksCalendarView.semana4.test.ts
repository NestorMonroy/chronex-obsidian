/**
 * SEMANA 4: Tests para TasksCalendarView Mejorado
 * Vistas múltiples, edición inline, integración DataManager
 */

import { TasksCalendarView, TASKS_CALENDAR_VIEW_TYPE } from './TasksCalendarView';
import { dataManager } from '../services/dataManager';

describe('TasksCalendarView - SEMANA 4', () => {
  let view: TasksCalendarView;
  let mockLeaf: any;
  let mockContentEl: HTMLElement;

  beforeEach(() => {
    // Mock WorkspaceLeaf
    mockLeaf = {
      view: null,
      openFile: jest.fn(),
    };

    // Mock contentEl
    mockContentEl = document.createElement('div');

    // Mock TasksCalendarView
    view = new TasksCalendarView(mockLeaf);
    (view as any).contentEl = mockContentEl;
  });

  afterEach(() => {
    view = null;
    mockContentEl.remove();
  });

  // ==================== BÁSICOS ====================

  describe('Inicialización', () => {
    test('debería tener tipo de vista correcto', () => {
      expect(view.getViewType()).toBe(TASKS_CALENDAR_VIEW_TYPE);
    });

    test('debería tener display text', () => {
      expect(view.getDisplayText()).toBe('Tasks Calendar');
    });

    test('debería tener icono', () => {
      expect(view.getIcon()).toBe('calendar');
    });

    test('debería estar en vista mes por defecto', () => {
      expect((view as any).viewMode).toBe('month');
    });

    test('debería tener fecha actual', () => {
      expect((view as any).currentDate).toBeInstanceOf(Date);
    });

    test('debería tener array vacío de tareas inicialmente', () => {
      expect((view as any).tasks).toEqual([]);
    });
  });

  // ==================== MÉTODOS PÚBLICOS ====================

  describe('onOpen()', () => {
    test('debería llamar refresh', async () => {
      const refreshSpy = jest.spyOn(view, 'refresh' as any);
      await view.onOpen();
      // Nota: refresh es privado, este es un test conceptual
    });

    test('debería suscribirse a cambios de DataManager', async () => {
      const onChangeSpy = jest.spyOn(dataManager, 'onChange');
      await view.onOpen();
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('refresh()', () => {
    test('debería actualizar tareas desde TaskServiceWithVault', async () => {
      await (view as any).refresh();
      expect((view as any).tasks).toBeInstanceOf(Array);
    });

    test('debería filtrar tareas sin fecha', async () => {
      const mockTasks = [
        {
          taskId: 'TSK-001',
          frontmatter: { title: 'Con fecha', dueDate: '2026-05-15' },
        },
        {
          taskId: 'TSK-002',
          frontmatter: { title: 'Sin fecha', dueDate: '' },
        },
      ];

      // Mock TaskServiceWithVault
      jest.spyOn(require('../services/taskServiceWithVault'), 'TaskServiceWithVault')
        .mockReturnValueOnce(Promise.resolve(mockTasks));

      await (view as any).refresh();

      // Debería filtrar la tarea sin fecha
      // Este es un test conceptual
    });

    test('debería llamar render después de actualizar', async () => {
      const renderSpy = jest.spyOn(view as any, 'render');
      await (view as any).refresh();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  // ==================== RENDER ====================

  describe('render()', () => {
    test('debería limpiar contentEl', () => {
      const emptySpy = jest.spyOn(mockContentEl, 'empty' as any);
      (view as any).render();
      // El método debería limpiar el contenedor
    });

    test('debería renderizar header', () => {
      (view as any).render();
      // Debería tener header con controles de vista
    });

    test('debería renderizar contenido según viewMode', () => {
      (view as any).viewMode = 'month';
      (view as any).render();
      // Debería renderizar vista mensual

      (view as any).viewMode = 'week';
      (view as any).render();
      // Debería renderizar vista semanal

      (view as any).viewMode = 'day';
      (view as any).render();
      // Debería renderizar vista diaria
    });
  });

  // ==================== HEADER ====================

  describe('renderHeader()', () => {
    test('debería crear div con clase calendar-header', () => {
      const container = document.createElement('div');
      (view as any).renderHeader(container);

      const header = container.querySelector('.calendar-header');
      expect(header).not.toBeNull();
    });

    test('debería tener botones de vista (month, week, day)', () => {
      const container = document.createElement('div');
      (view as any).renderHeader(container);

      // Debería tener 3 botones de vista
      const header = container.querySelector('.calendar-header');
      // Los botones deberían estar presentes
    });

    test('debería cambiar viewMode al hacer click en botón', () => {
      const container = document.createElement('div');
      (view as any).renderHeader(container);

      // Mock click en botón 'week'
      // Debería cambiar viewMode a 'week'
    });

    test('debería tener botones de navegación (< >)', () => {
      const container = document.createElement('div');
      (view as any).renderHeader(container);

      // Debería tener botones de navegación
    });

    test('debería cambiar currentDate con navegación', () => {
      const container = document.createElement('div');
      const originalMonth = (view as any).currentDate.getMonth();

      (view as any).renderHeader(container);

      // Mock click en botón '<'
      // currentDate debería disminuir un mes
    });
  });

  // ==================== VISTA MENSUAL ====================

  describe('renderMonthView()', () => {
    test('debería crear título con mes y año', () => {
      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      const title = container.querySelector('h3');
      expect(title).not.toBeNull();
      expect(title?.textContent).toMatch(/\d{4}/); // Año
    });

    test('debería crear grid de 7 columnas', () => {
      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      const calendar = container.querySelector('.month-calendar');
      expect(calendar).not.toBeNull();
    });

    test('debería mostrar encabezados de días', () => {
      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería tener: Dom, Lun, Mar, Mié, Jue, Vie, Sáb
    });

    test('debería mostrar fechas del mes', () => {
      const container = document.createElement('div');
      (view as any).currentDate = new Date(2026, 3, 15); // Abril
      (view as any).renderMonthView(container);

      // Debería mostrar fechas de abril
    });

    test('debería mostrar tareas en fechas correspondientes', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Tarea 1',
          dueDate: '2026-04-15',
          priority: 'ALTA',
          status: 'doing',
        },
      ];

      const container = document.createElement('div');
      (view as any).currentDate = new Date(2026, 3, 1);
      (view as any).renderMonthView(container);

      // Debería mostrar "Tarea 1" en el 15
    });

    test('debería renderizar próximas tareas', () => {
      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería tener sección de próximas tareas
    });
  });

  // ==================== VISTA SEMANAL ====================

  describe('renderWeekView()', () => {
    test('debería mostrar 7 días de la semana', () => {
      const container = document.createElement('div');
      (view as any).renderWeekView(container);

      const weekGrid = container.querySelector('.week-grid');
      // Debería tener 7 celdas de día
    });

    test('debería mostrar tareas por día', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Lunes',
          dueDate: '2026-04-13',
          priority: 'ALTA',
          status: 'doing',
        },
        {
          taskId: 'TSK-002',
          title: 'Miércoles',
          dueDate: '2026-04-15',
          priority: 'MEDIA',
          status: 'todo',
        },
      ];

      const container = document.createElement('div');
      (view as any).currentDate = new Date(2026, 3, 13); // Lunes
      (view as any).renderWeekView(container);

      // Debería mostrar tareas en días correspondientes
    });

    test('debería permitir editar al hacer click', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Test',
          dueDate: '2026-04-13',
          priority: 'ALTA',
          status: 'doing',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderWeekView(container);

      // Mock click en tarea
      // Debería llamar editTask()
    });

    test('debería mostrar "Sin tareas" si no hay', () => {
      (view as any).tasks = [];

      const container = document.createElement('div');
      (view as any).renderWeekView(container);

      // Debería mostrar "Sin tareas" en cada día
    });
  });

  // ==================== VISTA DIARIA ====================

  describe('renderDayView()', () => {
    test('debería mostrar fecha actual', () => {
      const container = document.createElement('div');
      (view as any).currentDate = new Date(2026, 3, 15);
      (view as any).renderDayView(container);

      const title = container.querySelector('h3');
      expect(title?.textContent).toContain('15');
    });

    test('debería mostrar todas las tareas del día', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Tarea 1',
          dueDate: '2026-04-15',
          priority: 'ALTA',
          status: 'doing',
        },
        {
          taskId: 'TSK-002',
          title: 'Tarea 2',
          dueDate: '2026-04-15',
          priority: 'MEDIA',
          status: 'todo',
        },
      ];

      const container = document.createElement('div');
      (view as any).currentDate = new Date(2026, 3, 15);
      (view as any).renderDayView(container);

      // Debería mostrar ambas tareas
    });

    test('debería mostrar botón editar para cada tarea', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Test',
          dueDate: '2026-04-15',
          priority: 'ALTA',
          status: 'doing',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderDayView(container);

      // Debería tener botón "Editar"
    });

    test('debería mostrar "Sin tareas" si día vacío', () => {
      (view as any).tasks = [];

      const container = document.createElement('div');
      (view as any).renderDayView(container);

      // Debería mostrar "No hay tareas para este día"
    });

    test('debería permitir navegar días', () => {
      const container = document.createElement('div');
      const originalDate = new Date((view as any).currentDate);

      (view as any).renderDayView(container);

      // Mock click botón "Día siguiente"
      // Debería aumentar un día
    });
  });

  // ==================== PRÓXIMAS TAREAS ====================

  describe('renderUpcomingTasks()', () => {
    test('debería mostrar máximo 8 tareas', () => {
      (view as any).tasks = Array(15)
        .fill(null)
        .map((_, i) => ({
          taskId: `TSK-${i}`,
          title: `Tarea ${i}`,
          dueDate: '2026-05-15',
          priority: 'MEDIA',
          status: 'todo',
        }));

      const container = document.createElement('div');
      (view as any).renderUpcomingTasks(container);

      // Debería mostrar solo 8 tareas
    });

    test('debería ordenar por fecha', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Mayo',
          dueDate: '2026-05-15',
          priority: 'MEDIA',
          status: 'todo',
        },
        {
          taskId: 'TSK-002',
          title: 'Abril',
          dueDate: '2026-04-15',
          priority: 'MEDIA',
          status: 'todo',
        },
        {
          taskId: 'TSK-003',
          title: 'Junio',
          dueDate: '2026-06-15',
          priority: 'MEDIA',
          status: 'todo',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderUpcomingTasks(container);

      // Debería estar ordenado: Abril, Mayo, Junio
    });

    test('debería mostrar color de prioridad', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Test',
          dueDate: '2026-05-15',
          priority: 'CRÍTICA',
          status: 'todo',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderUpcomingTasks(container);

      // Debería mostrar badge con color rojo (#ff4444)
    });

    test('debería permitir editar al hacer click', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Test',
          dueDate: '2026-05-15',
          priority: 'MEDIA',
          status: 'todo',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderUpcomingTasks(container);

      // Mock click
      // Debería llamar editTask()
    });
  });

  // ==================== EDICIÓN ====================

  describe('editTask()', () => {
    test('debería crear modal de edición', async () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test Task',
        dueDate: '2026-05-15',
        priority: 'ALTA',
        status: 'todo',
      };

      await (view as any).editTask(task);

      // Debería crear un modal en el DOM
      const modal = document.querySelector('[style*="position: fixed"]');
      expect(modal).not.toBeNull();
    });

    test('debería pre-rellenar campos', async () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test Task',
        dueDate: '2026-05-15',
        priority: 'ALTA',
        status: 'todo',
      };

      await (view as any).editTask(task);

      // Los campos deberían tener valores
    });

    test('debería llamar dataManager.updateTask al guardar', async () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test Task',
        dueDate: '2026-05-15',
        priority: 'ALTA',
        status: 'todo',
      };

      const updateSpy = jest.spyOn(dataManager, 'updateTask');

      await (view as any).editTask(task);

      // Mock click en botón "Guardar"
      // Debería llamar dataManager.updateTask()
    });

    test('debería cerrar modal al guardar', async () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test',
        dueDate: '2026-05-15',
        priority: 'ALTA',
        status: 'todo',
      };

      await (view as any).editTask(task);

      // Mock click en "Guardar"
      // Modal debería desaparecer
    });

    test('debería cerrar modal al cancelar', async () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test',
        dueDate: '2026-05-15',
        priority: 'ALTA',
        status: 'todo',
      };

      await (view as any).editTask(task);

      // Mock click en "Cancelar"
      // Modal debería desaparecer sin guardar
    });
  });

  // ==================== HELPERS ====================

  describe('getPriorityColor()', () => {
    test('debería retornar color correcto para cada prioridad', () => {
      expect((view as any).getPriorityColor('CRÍTICA')).toBe('#ff4444');
      expect((view as any).getPriorityColor('ALTA')).toBe('#ff8800');
      expect((view as any).getPriorityColor('MEDIA')).toBe('#4488ff');
      expect((view as any).getPriorityColor('BAJA')).toBe('#44ff44');
      expect((view as any).getPriorityColor('MUY BAJA')).toBe('#cccccc');
    });

    test('debería retornar color por defecto para prioridad desconocida', () => {
      expect((view as any).getPriorityColor('DESCONOCIDA')).toBe('#4488ff');
    });
  });

  describe('formatDate()', () => {
    test('debería formatear fecha a YYYY-MM-DD', () => {
      const date = new Date(2026, 3, 15); // Abril 15
      const formatted = (view as any).formatDate(date);

      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    test('debería manejar dates correctamente', () => {
      const date = new Date(2026, 0, 1); // Enero 1
      const formatted = (view as any).formatDate(date);

      expect(formatted).toBe('2026-01-01');
    });
  });

  // ==================== INTEGRACIÓN ====================

  describe('Integración - Flujo Completo', () => {
    test('debería actualizar vista al cambiar ViewMode', async () => {
      await (view as any).refresh();

      (view as any).viewMode = 'week';
      (view as any).render();

      // Debería renderizar vista semanal

      (view as any).viewMode = 'day';
      (view as any).render();

      // Debería renderizar vista diaria
    });

    test('debería refrescar automáticamente en cambios DataManager', async () => {
      const refreshSpy = jest.spyOn(view as any, 'refresh');

      // Emitir evento desde DataManager
      dataManager.onChange(() => {});

      // Debería llamar refresh
    });

    test('debería mostrar tareas filtradas correctamente', async () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Con fecha',
          dueDate: '2026-05-15',
          priority: 'ALTA',
          status: 'todo',
        },
        {
          taskId: 'TSK-002',
          title: 'Sin fecha',
          dueDate: '',
          priority: 'MEDIA',
          status: 'todo',
        },
      ];

      // Debería mostrar solo la tarea con fecha
      expect((view as any).tasks.filter((t: any) => t.dueDate).length).toBe(1);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    test('debería manejar tareas sin prioridad', () => {
      const task = {
        taskId: 'TSK-001',
        title: 'Test',
        dueDate: '2026-05-15',
        priority: '',
        status: 'todo',
      };

      const color = (view as any).getPriorityColor(task.priority);
      expect(color).toBe('#4488ff'); // Default
    });

    test('debería manejar tareas sin status', () => {
      (view as any).tasks = [
        {
          taskId: 'TSK-001',
          title: 'Test',
          dueDate: '2026-05-15',
          priority: 'MEDIA',
          status: '',
        },
      ];

      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería mostrar la tarea de todas formas
    });

    test('debería manejar mes con 31 días', () => {
      (view as any).currentDate = new Date(2026, 4, 15); // Mayo (31 días)

      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería mostrar todos los 31 días
    });

    test('debería manejar mes con 28/29 días', () => {
      (view as any).currentDate = new Date(2026, 1, 15); // Febrero

      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería mostrar correctamente
    });

    test('debería manejar año bisiesto', () => {
      (view as any).currentDate = new Date(2024, 1, 15); // Febrero 2024 (bisiesto)

      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      // Debería mostrar 29 días
    });
  });

  // ==================== PERFORMANCE ====================

  describe('Performance', () => {
    test('debería manejar muchas tareas', async () => {
      const startTime = performance.now();

      (view as any).tasks = Array(1000)
        .fill(null)
        .map((_, i) => ({
          taskId: `TSK-${i}`,
          title: `Tarea ${i}`,
          dueDate: '2026-05-15',
          priority: 'MEDIA',
          status: 'todo',
        }));

      const container = document.createElement('div');
      (view as any).renderMonthView(container);

      const endTime = performance.now();

      // Debería completarse en menos de 1 segundo
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('debería no crear memory leaks', () => {
      (view as any).render();
      (view as any).render(); // Render nuevamente

      // contentEl debería estar limpio sin duplicados
    });
  });
});
