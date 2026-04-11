/**
 * GanttRenderer - Timeline visual con Frappe Gantt
 * SEMANA 3: Renderización interactiva
 */

import { CachedTask } from '../../services/dataManager/types';
import { dataManager } from '../../services/dataManager';
import { GanttTask } from './GanttTask';

export interface GanttConfig {
  container: HTMLElement;
  taskHeight?: number;
  barHeight?: number;
  padding?: number;
  onDateChange?: (taskId: string, startDate: Date, endDate: Date) => void;
  onTaskClick?: (taskId: string) => void;
}

export interface GanttChartData {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  progress: number; // 0-100
  dependencies?: string[];
  custom_class?: string;
}

export class GanttRenderer {
  private config: GanttConfig;
  private tasks: CachedTask[] = [];
  private ganttChart: any;
  private ganttTasks: GanttTask[] = [];
  private listeners: (() => void)[] = [];

  constructor(config: GanttConfig) {
    this.config = {
      taskHeight: 35,
      barHeight: 20,
      padding: 15,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Renderizar Gantt chart
   */
  async render(projectId?: string): Promise<void> {
    try {
      // Cargar tareas del DataManager
      this.tasks = await dataManager.getProjectTasks(projectId);

      if (this.tasks.length === 0) {
        this.renderEmpty();
        return;
      }

      // Convertir a formato Gantt
      const ganttData = this.convertToGanttFormat(this.tasks);

      // Crear wrappers de tareas
      this.ganttTasks = this.tasks.map((task, index) => {
        return new GanttTask(task, ganttData[index]);
      });

      // Renderizar contenedor
      this.renderContainer();

      // Renderizar tasks
      this.renderTasks();

      console.log('[GanttRenderer] Rendered', this.ganttTasks.length, 'tasks');
    } catch (error) {
      console.error('[GanttRenderer] Render error:', error);
      this.renderError(error);
    }
  }

  /**
   * Convertir CachedTask a formato Gantt
   */
  private convertToGanttFormat(tasks: CachedTask[]): GanttChartData[] {
    return tasks.map((task) => {
      const startDate = task.frontmatter?.dueDate || new Date().toISOString().split('T')[0];
      const endDate = task.frontmatter?.dueDate || new Date().toISOString().split('T')[0];

      // Parsear progreso del contenido
      let progress = 0;
      if (task.content) {
        const progressData = this.parseProgress(task.content);
        progress = progressData.percentage;
      }

      return {
        id: task.taskId,
        name: task.frontmatter?.title || 'Sin título',
        start: startDate,
        end: endDate,
        progress,
        custom_class: this.getTaskClass(task),
      };
    });
  }

  /**
   * Parsear progreso del contenido
   */
  private parseProgress(content: string): {
    total: number;
    completed: number;
    percentage: number;
  } {
    try {
      const lines = content.split('\n');
      const checkboxes = lines.filter((line) => /^\s*-\s+\[/.test(line));

      const total = checkboxes.length;
      const completed = checkboxes.filter((line) => /\[x\]/i.test(line)).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, percentage };
    } catch {
      return { total: 0, completed: 0, percentage: 0 };
    }
  }

  /**
   * Obtener clase CSS para task
   */
  private getTaskClass(task: CachedTask): string {
    const priority = task.frontmatter?.priority || 'MEDIA';
    const status = task.frontmatter?.status || 'pendiente';

    const classes = [
      'gantt-task',
      `priority-${priority.toLowerCase()}`,
      `status-${status.toLowerCase()}`,
    ];

    return classes.join(' ');
  }

  /**
   * Renderizar contenedor
   */
  private renderContainer(): void {
    this.config.container!.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'gantt-header';
    header.innerHTML = `
      <div class="gantt-header-title">Cronograma</div>
      <div class="gantt-header-timeline">
        <div class="gantt-timeline-month"></div>
      </div>
    `;

    this.config.container!.appendChild(header);

    // Tasks container
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'gantt-tasks-container';
    tasksContainer.style.maxHeight = '600px';
    tasksContainer.style.overflowY = 'auto';

    this.config.container!.appendChild(tasksContainer);
  }

  /**
   * Renderizar tasks en el Gantt
   */
  private renderTasks(): void {
    const container = this.config.container!.querySelector('.gantt-tasks-container');
    if (!container) return;

    this.ganttTasks.forEach((ganttTask, index) => {
      const taskElement = this.createTaskElement(ganttTask, index);
      container.appendChild(taskElement);
    });
  }

  /**
   * Crear elemento de task
   */
  private createTaskElement(ganttTask: GanttTask, index: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'gantt-task-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.paddingBottom = `${this.config.padding}px`;

    // Task name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'gantt-task-name';
    nameDiv.style.width = '200px';
    nameDiv.style.minWidth = '200px';
    nameDiv.style.overflow = 'hidden';
    nameDiv.style.textOverflow = 'ellipsis';
    nameDiv.textContent = ganttTask.getChartData().name;
    nameDiv.style.cursor = 'pointer';
    nameDiv.addEventListener('click', () => {
      this.config.onTaskClick?.(ganttTask.getCachedTask().taskId);
    });

    row.appendChild(nameDiv);

    // Task bar
    const barDiv = document.createElement('div');
    barDiv.className = `gantt-task-bar ${ganttTask.getChartData().custom_class || ''}`;
    barDiv.style.flex = '1';
    barDiv.style.height = `${this.config.barHeight}px`;
    barDiv.style.marginLeft = '10px';
    barDiv.style.position = 'relative';
    barDiv.style.backgroundColor = this.getPriorityColor(ganttTask);
    barDiv.style.borderRadius = '4px';
    barDiv.style.cursor = 'grab';
    barDiv.style.userSelect = 'none';

    // Progress indicator
    const progress = ganttTask.getChartData().progress || 0;
    if (progress > 0) {
      const progressBar = document.createElement('div');
      progressBar.style.position = 'absolute';
      progressBar.style.height = '100%';
      progressBar.style.width = `${progress}%`;
      progressBar.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
      progressBar.style.borderRadius = '4px';
      barDiv.appendChild(progressBar);
    }

    // Task info overlay
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '0';
    infoDiv.style.left = '0';
    infoDiv.style.right = '0';
    infoDiv.style.bottom = '0';
    infoDiv.style.display = 'flex';
    infoDiv.style.alignItems = 'center';
    infoDiv.style.paddingLeft = '8px';
    infoDiv.style.color = 'white';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.fontWeight = 'bold';
    infoDiv.textContent = `${progress}%`;
    barDiv.appendChild(infoDiv);

    // Drag & drop
    this.makeBarDraggable(barDiv, ganttTask);

    row.appendChild(barDiv);

    return row;
  }

  /**
   * Hacer que la barra sea arrastrable
   */
  private makeBarDraggable(barElement: HTMLElement, ganttTask: GanttTask): void {
    let isDragging = false;
    let startX = 0;

    barElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      barElement.style.opacity = '0.8';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const days = Math.round(deltaX / 50); // 50px = 1 día

      if (days !== 0) {
        // Calcular nuevas fechas
        const chartData = ganttTask.getChartData();
        const startDate = new Date(chartData.start);
        const endDate = new Date(chartData.end);

        startDate.setDate(startDate.getDate() + days);
        endDate.setDate(endDate.getDate() + days);

        // Emitir evento
        this.config.onDateChange?.(ganttTask.getCachedTask().taskId, startDate, endDate);

        // Reset
        startX = e.clientX;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        barElement.style.opacity = '1';
      }
    });
  }

  /**
   * Obtener color según prioridad
   */
  private getPriorityColor(ganttTask: GanttTask): string {
    const priority = ganttTask.getCachedTask().frontmatter?.priority || 'MEDIA';

    const colors: Record<string, string> = {
      CRÍTICA: '#ff4444',
      ALTA: '#ff8800',
      MEDIA: '#4488ff',
      BAJA: '#44ff44',
      'MUY BAJA': '#cccccc',
    };

    return colors[priority] || '#4488ff';
  }

  /**
   * Suscribirse a cambios
   */
  private setupEventListeners(): void {
    // Suscribirse a cambios de DataManager
    const unsubscribe = dataManager.onChange((event) => {
      if (event.type === 'update' || event.type === 'delete' || event.type === 'create') {
        // Refrescar render
        this.render().catch((error) => {
          console.error('[GanttRenderer] Re-render error:', error);
        });
      }
    });

    this.listeners.push(unsubscribe);
  }

  /**
   * Renderizar estado vacío
   */
  private renderEmpty(): void {
    const container = this.config.container!;
    container.innerHTML = `
      <div class="gantt-empty" style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: #999;
        font-size: 16px;
      ">
        No hay tareas para mostrar
      </div>
    `;
  }

  /**
   * Renderizar error
   */
  private renderError(error: any): void {
    const container = this.config.container!;
    const message = error instanceof Error ? error.message : String(error);

    container.innerHTML = `
      <div class="gantt-error" style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: #ff4444;
        font-size: 14px;
      ">
        Error: ${message}
      </div>
    `;
  }

  /**
   * Actualizar tarea desde Gantt
   */
  async updateTaskDate(taskId: string, startDate: Date, endDate: Date): Promise<void> {
    try {
      const dateStr = startDate.toISOString().split('T')[0];

      await dataManager.updateTask(taskId, {
        dueDate: dateStr,
      });

      console.log('[GanttRenderer] Updated task', taskId, 'to', dateStr);
    } catch (error) {
      console.error('[GanttRenderer] Update error:', error);
    }
  }

  /**
   * Limpiar renderer
   */
  destroy(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];
    this.config.container!.innerHTML = '';
    this.ganttTasks = [];
    this.tasks = [];
  }

  /**
   * Obtener tareas renderizadas
   */
  getTasks(): GanttTask[] {
    return this.ganttTasks;
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      totalTasks: this.ganttTasks.length,
      completedTasks: this.ganttTasks.filter(
        (t) => t.getChartData().progress === 100
      ).length,
      averageProgress:
        this.ganttTasks.length > 0
          ? Math.round(
              this.ganttTasks.reduce((sum, t) => sum + t.getChartData().progress, 0) /
                this.ganttTasks.length
            )
          : 0,
    };
  }
}
