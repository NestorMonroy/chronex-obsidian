/**
 * UC-041: recurrenceManager
 * 
 * Sistema para manejar tareas recurrentes (repetidas).
 * Usa RRule para generar instancias.
 */

import type {
  RecurrentTask,
  TaskInstance,
  RecurrenceResult,
  ExpandResult,
  RescheduleResult,
  ValidationResult
} from './types';

export class RecurrenceManager {
  /**
   * Parsear recurrence desde línea markdown
   */
  parseRecurrenceFromLine(line: string): RecurrenceResult {
    if (!line) {
      return { success: true, recurrenceRule: null };
    }

    const match = line.match(/🔁\s*(.+?)(?:\s*[📅⏳]|$)/);
    if (!match) {
      return { success: true, recurrenceRule: null };
    }

    const recurrenceText = match[1].trim();
    const rrule = this.textToRRule(recurrenceText);

    if (!rrule.success) {
      return {
        success: false,
        error: `Invalid recurrence: ${recurrenceText}`
      };
    }

    return {
      success: true,
      recurrenceRule: rrule.rrule,
      frequency: rrule.frequency
    };
  }

  /**
   * Convertir texto a RRule
   * Ejemplos:
   * - "every day" → FREQ=DAILY
   * - "every weekday" → FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
   * - "every week on Monday" → FREQ=WEEKLY;BYDAY=MO
   * - "every 2 weeks" → FREQ=WEEKLY;INTERVAL=2
   * - "every month on the 15th" → FREQ=MONTHLY;BYMONTHDAY=15
   * - "every year" → FREQ=YEARLY
   */
  private textToRRule(text: string): {
    success: boolean;
    rrule?: string;
    frequency?: string;
  } {
    text = text.toLowerCase().trim();

    // DAILY
    if (text.includes('every day')) {
      return { success: true, rrule: 'FREQ=DAILY', frequency: 'DAILY' };
    }

    // WEEKDAY
    if (text.includes('every weekday')) {
      return {
        success: true,
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        frequency: 'WEEKLY'
      };
    }

    // WEEKLY
    if (text.includes('every week')) {
      const days = this.extractDayNames(text);
      if (days.length > 0) {
        return {
          success: true,
          rrule: `FREQ=WEEKLY;BYDAY=${days.join(',')}`,
          frequency: 'WEEKLY'
        };
      }
      return { success: true, rrule: 'FREQ=WEEKLY', frequency: 'WEEKLY' };
    }

    // BI-WEEKLY o MULTI-WEEK
    const weekMatch = text.match(/every (\d+) weeks?/);
    if (weekMatch) {
      const interval = weekMatch[1];
      const days = this.extractDayNames(text);
      const dayPart = days.length > 0 ? `;BYDAY=${days.join(',')}` : '';
      return {
        success: true,
        rrule: `FREQ=WEEKLY;INTERVAL=${interval}${dayPart}`,
        frequency: 'WEEKLY'
      };
    }

    // MONTHLY
    if (text.includes('every month')) {
      const dayMatch = text.match(/(\d+)(?:st|nd|rd|th)?/);
      if (dayMatch) {
        const day = dayMatch[1];
        return {
          success: true,
          rrule: `FREQ=MONTHLY;BYMONTHDAY=${day}`,
          frequency: 'MONTHLY'
        };
      }
      return { success: true, rrule: 'FREQ=MONTHLY', frequency: 'MONTHLY' };
    }

    // YEARLY
    if (text.includes('every year')) {
      return { success: true, rrule: 'FREQ=YEARLY', frequency: 'YEARLY' };
    }

    return { success: false };
  }

  /**
   * Extraer nombres de días de la cadena
   */
  private extractDayNames(text: string): string[] {
    const days: Record<string, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };

    const found: string[] = [];
    for (const [day, code] of Object.entries(days)) {
      if (text.includes(day)) {
        found.push(code);
      }
    }

    return found;
  }

  /**
   * Crear task recurrente
   */
  createRecurrentTask(task: RecurrentTask | null): RecurrenceResult {
    if (!task) {
      return { success: false, error: 'Task is null' };
    }

    if (!task.recurrence || task.recurrence.trim() === '') {
      return { success: false, error: 'No recurrence specified' };
    }

    const rrule = this.textToRRule(task.recurrence);
    if (!rrule.success) {
      return { success: false, error: `Invalid recurrence: ${task.recurrence}` };
    }

    const updated: RecurrentTask = {
      ...task,
      recurrenceRule: rrule.rrule
    };

    return {
      success: true,
      task: updated,
      recurrenceRule: rrule.rrule,
      frequency: rrule.frequency
    };
  }

  /**
   * Expandir task recurrente a instancias
   */
  expandInstances(task: RecurrentTask | null, days: number): ExpandResult {
    if (!task) {
      return { success: false, error: 'Task is null' };
    }

    if (!task.recurrence) {
      return { success: false, error: 'Task is not recurrent' };
    }

    if (!task.dueDate) {
      return { success: false, error: 'No dueDate specified' };
    }

    // Limitar máximo de instancias (365 por año)
    const maxDays = Math.min(days, 365);

    const instances: TaskInstance[] = [];
    const baseDate = new Date(task.dueDate);

    for (let i = 0; i < maxDays; i++) {
      const instanceDate = new Date(baseDate.getTime() + i * 86400000);
      const dateStr = instanceDate.toISOString().split('T')[0];

      // Calcular scheduledDate si existe
      let instanceScheduledDate: string | undefined;
      if (task.scheduledDate) {
        const scheduledBaseDate = new Date(task.scheduledDate);
        const diffDays = Math.floor(
          (instanceDate.getTime() - baseDate.getTime()) / 86400000
        );
        const instanceScheduled = new Date(
          scheduledBaseDate.getTime() + diffDays * 86400000
        );
        instanceScheduledDate = instanceScheduled.toISOString().split('T')[0];
      }

      instances.push({
        originalId: task.id,
        instanceId: `${task.id}@${dateStr}`,
        dueDate: dateStr,
        scheduledDate: instanceScheduledDate,
        occurrenceIndex: i
      });
    }

    return { success: true, instances };
  }

  /**
   * ¿Está la instancia vencida?
   */
  isOverdue(instance: TaskInstance | null): boolean {
    if (!instance) return false;

    const today = new Date().toISOString().split('T')[0];
    return instance.dueDate < today;
  }

  /**
   * Smart reschedule: reschedulear instancia pasada a hoy
   */
  smartReschedule(instance: TaskInstance | null): RescheduleResult {
    if (!instance) {
      return { success: false, error: 'Instance is null' };
    }

    if (!this.isOverdue(instance)) {
      return { success: true, instance };
    }

    const today = new Date().toISOString().split('T')[0];

    const rescheduled: TaskInstance = {
      ...instance,
      dueDate: today
    };

    return {
      success: true,
      instance: rescheduled
    };
  }

  /**
   * Validar RRule
   */
  validateRecurrenceRule(rule: string | null): ValidationResult {
    if (!rule) {
      return { valid: true };
    }

    if (!rule.includes('FREQ=')) {
      return { valid: false, errors: ['Invalid RRule: missing FREQ'] };
    }

    const validFreq = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    const freqMatch = rule.match(/FREQ=(\w+)/);
    if (freqMatch && !validFreq.includes(freqMatch[1])) {
      return {
        valid: false,
        errors: [`Invalid frequency: ${freqMatch[1]}`]
      };
    }

    return { valid: true };
  }

  /**
   * Validar task recurrente
   */
  validateRecurrentTask(task: RecurrentTask | null): ValidationResult {
    if (!task) {
      return { valid: false, errors: ['Task is null'] };
    }

    const errors: string[] = [];

    // Si tiene recurrence, validar RRule
    if (task.recurrence) {
      const rrule = this.textToRRule(task.recurrence);
      if (!rrule.success) {
        errors.push(`Invalid recurrence: ${task.recurrence}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Completar instancia
   */
  completeInstance(instance: TaskInstance | null): RescheduleResult {
    if (!instance) {
      return { success: false, error: 'Instance is null' };
    }

    // Generar próxima instancia (+ 1 día)
    const currentDate = new Date(instance.dueDate);
    const nextDate = new Date(currentDate.getTime() + 86400000);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const nextInstance: TaskInstance = {
      originalId: instance.originalId,
      instanceId: `${instance.originalId}@${nextDateStr}`,
      dueDate: nextDateStr,
      occurrenceIndex: instance.occurrenceIndex + 1
    };

    return {
      success: true,
      nextInstance
    };
  }

  /**
   * Obtener instancias activas
   */
  getActiveInstances(instances: TaskInstance[] | null): TaskInstance[] {
    if (!instances) return [];

    const today = new Date().toISOString().split('T')[0];

    return instances.filter(i => i.dueDate >= today);
  }

  /**
   * Filtrar instancias por rango de fechas
   */
  filterInstancesByDateRange(
    instances: TaskInstance[] | null,
    startDate: string,
    endDate: string
  ): TaskInstance[] {
    if (!instances) return [];

    return instances.filter(
      i => i.dueDate >= startDate && i.dueDate <= endDate
    );
  }
}

export default RecurrenceManager;
