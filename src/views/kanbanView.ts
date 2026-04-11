/**
 * KanbanView - Board Kanban de Tareas
 * Muestra tareas organizadas por estado (Pendiente, En Progreso, Completada)
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TaskServiceWithVault } from '../services/taskServiceWithVault';

export const KANBAN_VIEW_TYPE = 'chronex-obsidian-kanban';

interface TaskItem {
  taskId: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
}

export class KanbanView extends ItemView {
  private tasks: TaskItem[] = [];
  private statusGroups: Record<string, TaskItem[]> = {
    pendiente: [],
    'en-progreso': [],
    completa: [],
    archivado: [],
  };

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return KANBAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Tasks Kanban';
  }

  getIcon(): string {
    return 'trello';
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const tasks = await TaskServiceWithVault.listTasksFromVault();

    this.tasks = tasks.map((t) => ({
      taskId: t.taskId || '',
      title: t.frontmatter?.title || 'Unknown',
      priority: t.frontmatter?.priority || 'MEDIA',
      status: t.frontmatter?.status || 'pendiente',
      dueDate: t.frontmatter?.dueDate || '',
    }));

    // Agrupar por estado
    this.statusGroups = {
      pendiente: [],
      'en-progreso': [],
      completa: [],
      archivado: [],
    };

    this.tasks.forEach((task) => {
      const status = task.status.toLowerCase().replace(/\s+/g, '-');
      if (!this.statusGroups[status]) {
        this.statusGroups[status] = [];
      }
      this.statusGroups[status].push(task);
    });

    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Tasks Kanban Board' });

    const boardEl = contentEl.createEl('div', { cls: 'kanban-board' });

    // Renderizar columnas
    const columns = ['pendiente', 'en-progreso', 'completa', 'archivado'];
    const columnTitles: Record<string, string> = {
      pendiente: 'Pending',
      'en-progreso': 'In Progress',
      completa: 'Completed',
      archivado: 'Archived',
    };

    columns.forEach((status) => {
      this.renderColumn(boardEl, status, columnTitles[status] || status);
    });

    this.renderRefreshButton(contentEl);
  }

  private renderColumn(container: HTMLElement, status: string, title: string): void {
    const columnEl = container.createEl('div', { cls: 'kanban-column' });

    columnEl.createEl('h3', { text: `${title} (${this.statusGroups[status]?.length || 0})` });

    const tasksContainerEl = columnEl.createEl('div', { cls: 'kanban-tasks' });

    const tasks = this.statusGroups[status] || [];

    if (tasks.length === 0) {
      tasksContainerEl.createEl('p', { text: 'No tasks', cls: 'empty-column' });
      return;
    }

    tasks.forEach((task) => {
      const taskEl = tasksContainerEl.createEl('div', {
        cls: `kanban-task priority-${task.priority.toLowerCase()}`,
      });

      taskEl.createEl('strong', { text: task.title });

      const metaEl = taskEl.createEl('div', { cls: 'task-meta' });
      metaEl.createEl('span', { text: `Priority: ${task.priority}`, cls: 'priority-badge' });

      if (task.dueDate) {
        metaEl.createEl('span', { text: `Due: ${task.dueDate}`, cls: 'due-date' });
      }
    });
  }

  private renderRefreshButton(container: HTMLElement): void {
    const buttonEl = container.createEl('button', { text: 'Refresh' });
    buttonEl.addEventListener('click', () => this.refresh());
  }
}
