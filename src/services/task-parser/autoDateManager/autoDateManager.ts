/**
 * UC-046: autoDateManager
 * 
 * NUESTRO SISTEMA INDEPENDIENTE para manejar automáticamente fechas clave:
 * - createdDate: cuando se crea la tarea
 * - doneDate: cuando se completa (status = DONE)
 * - cancelledDate: cuando se cancela (status = CANCELLED)
 */

import type { AutoTask, DateChangeResult, DateValidationResult } from './types';

export class AutoDateManager {
  /**
   * Establecer createdDate (no sobrescribir si existe)
   */
  setCreatedDate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    const previousCreatedDate = task.createdDate;

    // Si ya existe, NO sobrescribir
    if (task.createdDate) {
      return {
        success: true,
        task,
        previousDates: { createdDate: previousCreatedDate }
      };
    }

    const now = new Date().toISOString();

    const updatedTask: AutoTask = {
      ...task,
      createdDate: now
    };

    return {
      success: true,
      task: updatedTask,
      newDates: { createdDate: now }
    };
  }

  /**
   * Establecer doneDate (solo si status = DONE)
   */
  setDoneDate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    // Solo si status es DONE
    if (task.status !== 'DONE') {
      return {
        success: true,
        task,
        error: undefined
      };
    }

    const previousDoneDate = task.doneDate;

    // Si ya existe, NO sobrescribir
    if (task.doneDate) {
      return {
        success: true,
        task,
        previousDates: { doneDate: previousDoneDate }
      };
    }

    const now = new Date().toISOString();

    const updatedTask: AutoTask = {
      ...task,
      doneDate: now
    };

    return {
      success: true,
      task: updatedTask,
      newDates: { doneDate: now }
    };
  }

  /**
   * Limpiar doneDate (cuando status cambia de DONE a algo más)
   */
  clearDoneDate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    if (!task.doneDate) {
      return {
        success: true,
        task
      };
    }

    const updatedTask: AutoTask = {
      ...task,
      doneDate: undefined
    };

    return {
      success: true,
      task: updatedTask,
      previousDates: { doneDate: task.doneDate }
    };
  }

  /**
   * Establecer cancelledDate (solo si status = CANCELLED)
   */
  setCancelledDate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    // Solo si status es CANCELLED
    if (task.status !== 'CANCELLED') {
      return {
        success: true,
        task,
        error: undefined
      };
    }

    const previousCancelledDate = task.cancelledDate;

    // Si ya existe, NO sobrescribir
    if (task.cancelledDate) {
      return {
        success: true,
        task,
        previousDates: { cancelledDate: previousCancelledDate }
      };
    }

    const now = new Date().toISOString();

    const updatedTask: AutoTask = {
      ...task,
      cancelledDate: now
    };

    return {
      success: true,
      task: updatedTask,
      newDates: { cancelledDate: now }
    };
  }

  /**
   * Limpiar cancelledDate (cuando status cambia de CANCELLED a algo más)
   */
  clearCancelledDate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    if (!task.cancelledDate) {
      return {
        success: true,
        task
      };
    }

    const updatedTask: AutoTask = {
      ...task,
      cancelledDate: undefined
    };

    return {
      success: true,
      task: updatedTask,
      previousDates: { cancelledDate: task.cancelledDate }
    };
  }

  /**
   * Aplicar automáticamente createdDate al crear una tarea
   */
  applyAutoDatesOnCreate(task: AutoTask | null): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    // Establecer createdDate si no existe
    return this.setCreatedDate(task);
  }

  /**
   * Aplicar automáticamente fechas cuando cambia el status
   */
  applyAutoDatesOnStatusChange(
    task: AutoTask | null,
    previousStatus: string
  ): DateChangeResult {
    if (!task) {
      return {
        success: false,
        task: null,
        error: 'Task is null or undefined'
      };
    }

    let updatedTask = task;

    // Si NUEVO status es DONE → setDoneDate
    if (task.status === 'DONE') {
      const result = this.setDoneDate(updatedTask);
      if (result.task) updatedTask = result.task;
    }
    // Si NUEVO status es CANCELLED → setCancelledDate
    else if (task.status === 'CANCELLED') {
      const result = this.setCancelledDate(updatedTask);
      if (result.task) updatedTask = result.task;
    }
    // Si ANTERIOR era DONE y NUEVO no → limpiar doneDate
    else if (previousStatus === 'DONE' && (task.status as any) !== 'DONE') {
      const result = this.clearDoneDate(updatedTask);
      if (result.task) updatedTask = result.task;
    }
    // Si ANTERIOR era CANCELLED y NUEVO no → limpiar cancelledDate
    else if (previousStatus === 'CANCELLED' && (task.status as any) !== 'CANCELLED') {
      const result = this.clearCancelledDate(updatedTask);
      if (result.task) updatedTask = result.task;
    }

    return {
      success: true,
      task: updatedTask
    };
  }

  /**
   * Validar que las fechas sean lógicamente correctas
   */
  validateTaskDates(task: AutoTask | null): boolean {
    if (!task) {
      return false;
    }

    // Si hay createdDate y doneDate: createdDate ≤ doneDate
    if (task.createdDate && task.doneDate) {
      const createdTime = new Date(task.createdDate).getTime();
      const doneTime = new Date(task.doneDate).getTime();

      if (doneTime < createdTime) {
        return false;
      }
    }

    // Si hay createdDate y cancelledDate: createdDate ≤ cancelledDate
    if (task.createdDate && task.cancelledDate) {
      const createdTime = new Date(task.createdDate).getTime();
      const cancelledTime = new Date(task.cancelledDate).getTime();

      if (cancelledTime < createdTime) {
        return false;
      }
    }

    // NO pueden coexistir doneDate y cancelledDate (son mutuamente excluyentes)
    if (task.doneDate && task.cancelledDate) {
      return false;
    }

    return true;
  }
}

export default AutoDateManager;
