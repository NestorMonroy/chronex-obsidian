/**
 * UC-040: validateParsedTask
 * 
 * Valida que una tarea parseada tiene todos los campos requeridos y válidos
 */

import type { ParsedTask, ValidationResult, TaskStatus, TaskPriority } from './types';

/**
 * Valida si un string es una fecha válida en formato YYYY-MM-DD
 */
function isValidDateString(dateStr: string): boolean {
  // Formato YYYY-MM-DD
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(regex);
  
  if (!match) {
    return false;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Validar rango de mes (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  // Validar rango de día (1-31)
  if (day < 1 || day > 31) {
    return false;
  }

  // Crear fecha y verificar que es válida
  const date = new Date(year, month - 1, day);
  
  // Verificar que la fecha es válida (no fue convertida)
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }

  return true;
}

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
  if (task.dueDate) {
    if (!isValidDateString(task.dueDate)) {
      errors.push(`Invalid dueDate: ${task.dueDate} (expected valid YYYY-MM-DD)`);
    }
  }

  // Validar scheduledDate
  if (task.scheduledDate) {
    if (!isValidDateString(task.scheduledDate)) {
      errors.push(`Invalid scheduledDate: ${task.scheduledDate} (expected valid YYYY-MM-DD)`);
    }
  }

  // Validar createdDate
  if (task.createdDate) {
    if (!isValidDateString(task.createdDate)) {
      errors.push(`Invalid createdDate: ${task.createdDate} (expected valid YYYY-MM-DD)`);
    }
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
