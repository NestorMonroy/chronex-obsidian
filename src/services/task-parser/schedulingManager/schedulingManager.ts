/**
 * UC-047: schedulingManager
 * 
 * Sistema para manejar scheduledDate: cuándo trabajar en una tarea.
 */

import type { ScheduledTask, SchedulingResult, ParseResult } from './types';

export class SchedulingManager {
  /**
   * Parsear scheduledDate desde línea markdown
   */
  parseScheduledDateFromLine(line: string): ParseResult {
    if (!line) {
      return { success: true, scheduledDate: null };
    }

    const match = line.match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
    if (!match) {
      return { success: true, scheduledDate: null };
    }

    const dateStr = match[1];
    if (!this.isValidDate(dateStr)) {
      return {
        success: false,
        scheduledDate: null,
        error: `Invalid date format: ${dateStr}`
      };
    }

    return { success: true, scheduledDate: dateStr };
  }

  /**
   * Establecer scheduledDate
   */
  setScheduledDate(task: ScheduledTask | null, date: string | null): SchedulingResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null'
      };
    }

    if (date && !this.isValidDate(date)) {
      return {
        success: false,
        task: null,
        error: `Invalid date format: ${date}`
      };
    }

    const updated: ScheduledTask = {
      ...task,
      scheduledDate: date || undefined
    };

    return {
      success: true,
      task: updated,
      previousScheduledDate: task.scheduledDate,
      newScheduledDate: date || undefined
    };
  }

  /**
   * Validar que scheduledDate sea lógicamente correcto
   */
  validateScheduling(task: ScheduledTask | null): SchedulingResult {
    if (!task) {
      return { success: false, task: null, error: 'Task is null' };
    }

    const warnings: string[] = [];

    // scheduledDate no puede ser en el pasado
    if (task.scheduledDate) {
      const scheduled = new Date(task.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (scheduled < today) {
        warnings.push('scheduledDate es anterior a hoy');
      }
    }

    // scheduledDate debe ser <= dueDate
    if (task.scheduledDate && task.dueDate) {
      const scheduled = new Date(task.scheduledDate);
      const due = new Date(task.dueDate);

      if (scheduled > due) {
        warnings.push('scheduledDate es posterior a dueDate');
      }
    }

    return {
      success: warnings.length === 0,
      task,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Smart scheduling: ajustar automáticamente si es necesario
   */
  smartSchedule(task: ScheduledTask | null): SchedulingResult {
    if (!task) {
      return { success: false, task: null, error: 'Task is null' };
    }

    const warnings: string[] = [];
    let updated = { ...task };

    // Si scheduledDate > dueDate, ajustar a dueDate
    if (updated.scheduledDate && updated.dueDate) {
      const scheduled = new Date(updated.scheduledDate);
      const due = new Date(updated.dueDate);

      if (scheduled > due) {
        updated.scheduledDate = updated.dueDate;
        warnings.push('Ajustado scheduledDate a dueDate');
      }
    }

    return {
      success: true,
      task: updated,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * ¿Está agendada para hoy?
   */
  isScheduledForToday(task: ScheduledTask | null): boolean {
    if (!task || !task.scheduledDate) return false;

    const today = new Date().toISOString().split('T')[0];
    return task.scheduledDate === today;
  }

  /**
   * ¿Está vencida?
   */
  isOverdue(task: ScheduledTask | null): boolean {
    if (!task || !task.dueDate) return false;

    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  }

  /**
   * Posponer tarea N días
   */
  reschedule(task: ScheduledTask | null, days: number): SchedulingResult {
    if (!task) {
      return { success: false, task: null, error: 'Task is null' };
    }

    const baseDate = task.scheduledDate
      ? new Date(task.scheduledDate)
      : new Date();

    const newDate = new Date(baseDate.getTime() + days * 86400000);
    const dateStr = newDate.toISOString().split('T')[0];

    return {
      success: true,
      task: { ...task, scheduledDate: dateStr },
      newScheduledDate: dateStr
    };
  }

  /**
   * Filtrar tareas por período
   */
  filterByScheduledDate(
    tasks: ScheduledTask[],
    period: 'today' | 'week' | 'month'
  ): { tasks: ScheduledTask[]; total: number } {
    const today = new Date();
    const filtered = tasks.filter(task => {
      if (!task.scheduledDate) return false;

      const scheduled = new Date(task.scheduledDate);

      switch (period) {
        case 'today': {
          const todayStr = today.toISOString().split('T')[0];
          return task.scheduledDate === todayStr;
        }
        case 'week': {
          const weekEnd = new Date(today.getTime() + 7 * 86400000);
          return scheduled >= today && scheduled <= weekEnd;
        }
        case 'month': {
          const monthEnd = new Date(today.getTime() + 30 * 86400000);
          return scheduled >= today && scheduled <= monthEnd;
        }
      }
    });

    return { tasks: filtered, total: filtered.length };
  }

  /**
   * Validar formato de fecha
   */
  private isValidDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

export default SchedulingManager;
