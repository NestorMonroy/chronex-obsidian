/**
 * UC-055: TaskCollector
 * 
 * Sistema para coleccionar tasks del Vault y proporcionar
 * filtrado, agrupación y estadísticas.
 */

import type {
  Task,
  DateFilter,
  TaskStats
} from './types';

export class TaskCollector {
  private tasks: Task[] = [];

  /**
   * Coleccionar todas las tasks del vault
   */
  async collectAllTasks(vaultPath: string): Promise<Task[]> {
    try {
      // Simulación: en producción usaría VaultReader
      this.tasks = [];
      return this.tasks;
    } catch (error) {
      console.error(`Error collecting tasks from ${vaultPath}:`, error);
      return [];
    }
  }

  /**
   * Filtrar tasks por fecha
   */
  filterByDate(tasks: Task[], filter: DateFilter): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter.type) {
      case 'today':
        return tasks.filter(t => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate.toDateString() === today.toDateString();
        });

      case 'week': {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return tasks.filter(t => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate >= today && taskDate <= nextWeek;
        });
      }

      case 'month': {
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return tasks.filter(t => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate >= today && taskDate <= nextMonth;
        });
      }

      case 'overdue':
        return tasks.filter(t => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate < today && t.status !== 'DONE';
        });

      default:
        return tasks;
    }
  }

  /**
   * Filtrar tasks por status
   */
  filterByStatus(tasks: Task[], status: Task['status']): Task[] {
    return tasks.filter(t => t.status === status);
  }

  /**
   * Filtrar tasks por prioridad
   */
  filterByPriority(tasks: Task[], priority: Task['priority']): Task[] {
    return tasks.filter(t => t.priority === priority);
  }

  /**
   * Filtrar tasks por tags
   */
  filterByTags(tasks: Task[], tags: string[]): Task[] {
    return tasks.filter(t =>
      tags.some(tag => t.tags.includes(tag))
    );
  }

  /**
   * Filtrar tasks por carpeta
   */
  filterByFolder(tasks: Task[], folderPath: string): Task[] {
    return tasks.filter(t => t.filePath.includes(folderPath));
  }

  /**
   * Agrupar tasks por carpeta
   */
  groupByFolder(tasks: Task[]): Map<string, Task[]> {
    const grouped = new Map<string, Task[]>();

    for (const task of tasks) {
      const folderMatch = task.filePath.match(/^([^/]+)\//);
      const folder = folderMatch ? folderMatch[1] : 'root';

      if (!grouped.has(folder)) {
        grouped.set(folder, []);
      }
      grouped.get(folder)!.push(task);
    }

    return grouped;
  }

  /**
   * Agrupar tasks por status
   */
  groupByStatus(tasks: Task[]): Map<Task['status'], Task[]> {
    const grouped = new Map<Task['status'], Task[]>();

    for (const task of tasks) {
      if (!grouped.has(task.status)) {
        grouped.set(task.status, []);
      }
      grouped.get(task.status)!.push(task);
    }

    return grouped;
  }

  /**
   * Agrupar tasks por prioridad
   */
  groupByPriority(tasks: Task[]): Map<Task['priority'], Task[]> {
    const grouped = new Map<Task['priority'], Task[]>();

    for (const task of tasks) {
      if (!grouped.has(task.priority)) {
        grouped.set(task.priority, []);
      }
      grouped.get(task.priority)!.push(task);
    }

    return grouped;
  }

  /**
   * Obtener estadísticas de tasks
   */
  getStatistics(tasks: Task[]): TaskStats {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const pending = total - completed;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

    // By status
    const byStatus: Record<string, number> = {};
    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    }

    // By priority
    const byPriority: Record<string, number> = {};
    for (const task of tasks) {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    }

    return {
      total,
      completed,
      pending,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      byStatus,
      byPriority
    };
  }
}

export default TaskCollector;
