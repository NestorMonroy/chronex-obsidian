/**
 * TasksCalendarView - Calendario de Tareas
 * Muestra tareas por vencimiento en formato calendario
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TaskServiceWithVault } from '../services/taskServiceWithVault';

export const TASKS_CALENDAR_VIEW_TYPE = 'obsidian-repo-tasks-calendar';

interface TaskEvent {
  taskId: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
}

export class TasksCalendarView extends ItemView {
  private tasks: TaskEvent[] = [];
  private currentMonth: Date = new Date();

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
      .filter((t) => t.dueDate); // Solo tareas con fecha de vencimiento

    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Tasks Calendar' });

    this.renderCalendar(contentEl);
    this.renderUpcomingTasks(contentEl);
  }

  private renderCalendar(container: HTMLElement): void {
    const calendarEl = container.createEl('div', { cls: 'tasks-calendar' });

    const monthYear = this.currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    calendarEl.createEl('h3', { text: monthYear });

    // Days of week
    const daysEl = calendarEl.createEl('div', { cls: 'calendar-days' });
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day) => {
      daysEl.createEl('div', { text: day, cls: 'calendar-day-header' });
    });

    // Calendar dates
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    let currentDate = new Date(startDate);

    while (currentDate <= lastDay) {
      const dateEl = daysEl.createEl('div', {
        text: String(currentDate.getDate()),
        cls: 'calendar-date',
      });

      if (
        currentDate.getMonth() !== this.currentMonth.getMonth() ||
        currentDate.getFullYear() !== this.currentMonth.getFullYear()
      ) {
        dateEl.addClass('other-month');
      }

      // Check for tasks on this date
      const dateStr = currentDate.toISOString().split('T')[0];
      const tasksOnDate = this.tasks.filter((t) => t.dueDate === dateStr);

      if (tasksOnDate.length > 0) {
        dateEl.addClass('has-tasks');
        const badge = dateEl.createEl('span', {
          text: String(tasksOnDate.length),
          cls: 'task-badge',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private renderUpcomingTasks(container: HTMLElement): void {
    const upcomingEl = container.createEl('div', { cls: 'upcoming-tasks' });

    upcomingEl.createEl('h3', { text: 'Upcoming Tasks' });

    const sortedTasks = this.tasks.sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const nextSevenDays = sortedTasks.filter((t) => {
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return dueDate >= today && dueDate <= sevenDaysFromNow;
    });

    if (nextSevenDays.length === 0) {
      upcomingEl.createEl('p', { text: 'No upcoming tasks in the next 7 days' });
      return;
    }

    nextSevenDays.forEach((task) => {
      const taskEl = upcomingEl.createEl('div', { cls: `task-item priority-${task.priority.toLowerCase()}` });

      taskEl.createEl('strong', { text: task.title });
      taskEl.createEl('span', { text: ` - Due: ${task.dueDate}` });
      taskEl.createEl('span', { text: ` [${task.status}]`, cls: 'task-status' });
    });
  }
}
