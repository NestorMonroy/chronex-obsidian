/**
 * UC-040: validateParsedTask
 * 
 * Valida que una tarea parseada tiene todos los campos requeridos y válidos
 */

import type { ParsedTask, ValidationResult, TaskStatus, TaskPriority } from './types';

/**
 * Valida que una tarea parseada tiene todos los campos requeridos
 */
export function validateParsedTask(task: any): ValidationResult {
  const errors: string[] = [];

  // Validar descripción
  if (!task.description || task.description.trim().length === 0) {
    errors.push('Task must have a description');
  }

  // Validar status
  const validStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'FORWARDED'];
  if (!validStatuses.includes(task.status)) {
    errors.push(`Invalid status: ${task.status} (must be one of: ${validStatuses.join(', ')})`);
  }

  // Validar prioridad
  const validPriorities: TaskPriority[] = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
  if (!validPriorities.includes(task.priority)) {
    errors.push(`Invalid priority: ${task.priority} (must be one of: ${validPriorities.join(', ')})`);
  }

  // Validar dueDate
  if (task.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
    errors.push(`Invalid dueDate format: ${task.dueDate} (expected YYYY-MM-DD)`);
  }

  // Validar scheduledDate
  if (task.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.scheduledDate)) {
    errors.push(`Invalid scheduledDate format: ${task.scheduledDate} (expected YYYY-MM-DD)`);
  }

  // Validar createdDate
  if (task.createdDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.createdDate)) {
    errors.push(`Invalid createdDate format: ${task.createdDate} (expected YYYY-MM-DD)`);
  }

  // Validar tags
  if (!Array.isArray(task.tags)) {
    errors.push('Tags must be an array');
  }

  // Validar blockLink
  if (task.blockLink && !/^\^[\w-]+$/.test(task.blockLink)) {
    errors.push(`Invalid blockLink format: ${task.blockLink} (must start with ^)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default validateParsedTask;
