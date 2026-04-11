/**
 * TasksCalendarView - Calendario de Tareas (MEJORADO SEMANA 4)
 * Vistas múltiples: Mes, Semana, Día + Edición inline + Drag & drop
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TaskServiceWithVault } from '../services/taskServiceWithVault';
import { dataManager } from '../services/dataManager';

export const TASKS_CALENDAR_VIEW_TYPE = 'chronex-obsidian-tasks-calendar';

type ViewMode = 'month' | 'week' | 'day';

interface TaskEvent {
  taskId: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
}

export class TasksCalendarView extends ItemView {
  private tasks: TaskEvent[] = [];
  private currentDate: Date = new Date();
  private viewMode: ViewMode = 'month';

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return TASKS_CALENDAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Tasks Calendar';
  }

  getIcon(): string {
    return 'calendar';
  }

  async onOpen(): Promise<void> {
    dataManager.onChange(() => {
      this.refresh().catch((error) => {
        console.error('[TasksCalendarView] Auto-refresh error:', error);
      });
    });

    await this.refresh();
  }

  async refresh(): Promise<void> {
    const tasks = await TaskServiceWithVault.listTasksFromVault();

    this.tasks = tasks
      .map((t) => ({
        taskId: t.taskId || '',
        title: t.frontmatter?.title || 'Unknown',
        dueDate: t.frontmatter?.dueDate || '',
        priority: t.frontmatter?.priority || 'MEDIA',
        status: t.frontmatter?.status || 'pendiente',
      }))
      .filter((t) => t.dueDate);

    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    this.renderHeader(contentEl);
    this.renderViewContent(contentEl);
  }

  private renderHeader(container: HTMLElement): void {
    const header = container.createEl('div', { cls: 'calendar-header' });
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '10px';
    header.style.borderBottom = '1px solid var(--background-modifier-border)';

    header.createEl('h2', { text: 'Calendar & Tasks' });

    const controls = header.createEl('div', { cls: 'header-controls' });
    controls.style.display = 'flex';
    controls.style.gap = '10px';

    ['month', 'week', 'day'].forEach((mode) => {
      const btn = controls.createEl('button', {
        text: mode.charAt(0).toUpperCase() + mode.slice(1),
      });

      btn.style.padding = '5px 10px';
      btn.style.cursor = 'pointer';
      btn.style.borderRadius = '4px';
      btn.style.border = 'none';
      btn.style.backgroundColor = mode === this.viewMode ? 'var(--interactive-accent)' : 'transparent';
      btn.style.color = mode === this.viewMode ? 'white' : 'inherit';

      btn.addEventListener('click', () => {
        this.viewMode = mode as ViewMode;
        this.render();
      });
    });

    const nav = header.createEl('div', { cls: 'date-nav' });
    nav.style.display = 'flex';
    nav.style.gap = '5px';

    const prevBtn = nav.createEl('button', { text: '<' });
    prevBtn.style.padding = '5px 10px';
    prevBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    const nextBtn = nav.createEl('button', { text: '>' });
    nextBtn.style.padding = '5px 10px';
    nextBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });
  }

  private renderViewContent(container: HTMLElement): void {
    const content = container.createEl('div', { cls: 'calendar-content' });
    content.style.padding = '10px';

    switch (this.viewMode) {
      case 'month':
        this.renderMonthView(content);
        break;
      case 'week':
        this.renderWeekView(content);
        break;
      case 'day':
        this.renderDayView(content);
        break;
    }
  }

  private renderMonthView(container: HTMLElement): void {
    const monthYear = this.currentDate.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });

    container.createEl('h3', { text: monthYear });

    const calendar = container.createEl('div', { cls: 'month-calendar' });
    calendar.style.display = 'grid';
    calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';
    calendar.style.gap = '5px';

    ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach((day) => {
      const header = calendar.createEl('div', { text: day });
      header.style.fontWeight = 'bold';
      header.style.textAlign = 'center';
      header.style.padding = '5px';
    });

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    let currentDate = new Date(startDate);

    while (currentDate <= lastDay) {
      const dateCell = calendar.createEl('div', { cls: 'date-cell' });
      dateCell.style.border = '1px solid var(--background-modifier-border)';
      dateCell.style.borderRadius = '4px';
      dateCell.style.padding = '5px';
      dateCell.style.minHeight = '80px';
      dateCell.style.cursor = 'pointer';

      const dateStr = this.formatDate(currentDate);
      const dayTasks = this.tasks.filter((t) => t.dueDate === dateStr);

      const dateNumber = dateCell.createEl('strong', {
        text: String(currentDate.getDate()),
      });

      if (currentDate.getMonth() !== this.currentDate.getMonth()) {
        dateNumber.style.color = '#999';
      }

      if (dayTasks.length > 0) {
        dateCell.style.backgroundColor = 'var(--background-secondary)';

        dayTasks.slice(0, 2).forEach((task) => {
          const taskEl = dateCell.createEl('small', { text: task.title });
          taskEl.style.display = 'block';
          taskEl.style.marginTop = '3px';
          taskEl.style.overflow = 'hidden';
          taskEl.style.textOverflow = 'ellipsis';
          taskEl.style.whiteSpace = 'nowrap';
          taskEl.style.borderLeft = `2px solid ${this.getPriorityColor(task.priority)}`;
          taskEl.style.paddingLeft = '3px';
        });

        if (dayTasks.length > 2) {
          const more = dateCell.createEl('small', {
            text: `+${dayTasks.length - 2} más`,
          });
          more.style.color = '#999';
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.renderUpcomingTasks(container);
  }

  private renderWeekView(container: HTMLElement): void {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

    container.createEl('h3', {
      text: `Semana del ${startOfWeek.toLocaleDateString('es-ES')}`,
    });

    const weekGrid = container.createEl('div', { cls: 'week-grid' });
    weekGrid.style.display = 'grid';
    weekGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    weekGrid.style.gap = '10px';

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const dayCell = weekGrid.createEl('div', { cls: 'week-day-cell' });
      dayCell.style.border = '1px solid var(--background-modifier-border)';
      dayCell.style.borderRadius = '4px';
      dayCell.style.padding = '10px';
      dayCell.style.minHeight = '200px';

      dayCell.createEl('strong', {
        text: date.toLocaleDateString('es-ES', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      });

      const dateStr = this.formatDate(date);
      const dayTasks = this.tasks.filter((t) => t.dueDate === dateStr);

      dayTasks.forEach((task) => {
        const taskEl = dayCell.createEl('div', { cls: 'week-task-item' });
        taskEl.style.marginTop = '8px';
        taskEl.style.padding = '8px';
        taskEl.style.backgroundColor = 'var(--background-secondary)';
        taskEl.style.borderRadius = '3px';
        taskEl.style.cursor = 'pointer';
        taskEl.style.borderLeft = `3px solid ${this.getPriorityColor(task.priority)}`;

        taskEl.createEl('strong', { text: task.title });
        taskEl.createEl('br');
        const status = taskEl.createEl('small', { text: task.status });
        status.style.color = '#999';

        taskEl.addEventListener('click', () => {
          this.editTask(task);
        });
      });

      if (dayTasks.length === 0) {
        dayCell.createEl('small', { text: 'Sin tareas' }).style.color = '#999';
      }
    }
  }

  private renderDayView(container: HTMLElement): void {
    container.createEl('h3', {
      text: this.currentDate.toLocaleDateString('es-ES'),
    });

    const dateStr = this.formatDate(this.currentDate);
    const dayTasks = this.tasks.filter((t) => t.dueDate === dateStr);

    const tasksDiv = container.createEl('div', { cls: 'day-tasks' });

    if (dayTasks.length === 0) {
      tasksDiv.createEl('p', { text: 'No hay tareas para este día' }).style.color = '#999';
    } else {
      dayTasks.forEach((task) => {
        const taskRow = tasksDiv.createEl('div', { cls: 'day-task-row' });
        taskRow.style.display = 'flex';
        taskRow.style.justifyContent = 'space-between';
        taskRow.style.alignItems = 'center';
        taskRow.style.padding = '12px';
        taskRow.style.marginBottom = '8px';
        taskRow.style.borderLeft = `4px solid ${this.getPriorityColor(task.priority)}`;
        taskRow.style.backgroundColor = 'var(--background-secondary)';
        taskRow.style.borderRadius = '4px';

        const infoDiv = taskRow.createEl('div');
        infoDiv.createEl('strong', { text: task.title });
        const statusSmall = infoDiv.createEl('small', {
          text: ` (${task.status})`,
        });
        statusSmall.style.marginLeft = '10px';
        statusSmall.style.color = '#999';

        const editBtn = taskRow.createEl('button', { text: 'Editar' });
        editBtn.style.padding = '5px 10px';
        editBtn.addEventListener('click', () => {
          this.editTask(task);
        });
      });
    }
  }

  private renderUpcomingTasks(container: HTMLElement): void {
    container.createEl('h3', { text: 'Próximas tareas' }).style.marginTop = '20px';

    const sorted = [...this.tasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const upcoming = sorted.slice(0, 8);

    if (upcoming.length === 0) {
      container.createEl('p', { text: 'No hay tareas próximas' }).style.color = '#999';
      return;
    }

    upcoming.forEach((task) => {
      const taskEl = container.createEl('div', { cls: 'upcoming-item' });
      taskEl.style.display = 'flex';
      taskEl.style.justifyContent = 'space-between';
      taskEl.style.alignItems = 'center';
      taskEl.style.padding = '8px';
      taskEl.style.borderBottom = '1px solid var(--background-modifier-border)';
      taskEl.style.cursor = 'pointer';

      const infoDiv = taskEl.createEl('div');
      infoDiv.createEl('strong', { text: task.title });
      const dateSmall = infoDiv.createEl('small', { text: ` - ${task.dueDate}` });
      dateSmall.style.marginLeft = '10px';
      dateSmall.style.color = '#999';

      const priority = taskEl.createEl('span', { text: task.priority });
      priority.style.padding = '2px 8px';
      priority.style.borderRadius = '3px';
      priority.style.fontSize = '12px';
      priority.style.backgroundColor = this.getPriorityColor(task.priority);
      priority.style.color = 'white';

      taskEl.addEventListener('click', () => {
        this.editTask(task);
      });
    });
  }

  private async editTask(task: TaskEvent): Promise<void> {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--background-primary);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 400px;
    `;

    const title = modal.appendChild(document.createElement('h3'));
    title.textContent = 'Editar tarea';

    const titleLabel = modal.appendChild(document.createElement('label'));
    titleLabel.textContent = 'Título';
    titleLabel.style.display = 'block';
    titleLabel.style.marginTop = '10px';

    const titleInput = modal.appendChild(document.createElement('input'));
    titleInput.type = 'text';
    titleInput.value = task.title;
    titleInput.style.width = '100%';
    titleInput.style.padding = '8px';
    titleInput.style.marginTop = '5px';
    titleInput.style.marginBottom = '10px';

    const dateLabel = modal.appendChild(document.createElement('label'));
    dateLabel.textContent = 'Fecha de vencimiento';
    dateLabel.style.display = 'block';
    dateLabel.style.marginTop = '10px';

    const dateInput = modal.appendChild(document.createElement('input'));
    dateInput.type = 'date';
    dateInput.value = task.dueDate;
    dateInput.style.width = '100%';
    dateInput.style.padding = '8px';
    dateInput.style.marginTop = '5px';
    dateInput.style.marginBottom = '10px';

    const buttonDiv = modal.appendChild(document.createElement('div'));
    buttonDiv.style.display = 'flex';
    buttonDiv.style.gap = '10px';
    buttonDiv.style.marginTop = '20px';

    const saveBtn = buttonDiv.appendChild(document.createElement('button'));
    saveBtn.textContent = 'Guardar';
    saveBtn.style.padding = '8px 16px';
    saveBtn.style.cursor = 'pointer';

    saveBtn.addEventListener('click', async () => {
      await dataManager.updateTask(task.taskId, {
        taskName: titleInput.value,
        dueDate: dateInput.value,
      });

      document.body.removeChild(modal);
      document.body.removeChild(backdrop);
    });

    const cancelBtn = buttonDiv.appendChild(document.createElement('button'));
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.cursor = 'pointer';

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.removeChild(backdrop);
    });

    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      CRÍTICA: '#ff4444',
      ALTA: '#ff8800',
      MEDIA: '#4488ff',
      BAJA: '#44ff44',
      'MUY BAJA': '#cccccc',
    };

    return colors[priority] || '#4488ff';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
