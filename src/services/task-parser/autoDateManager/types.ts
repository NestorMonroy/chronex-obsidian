/**
 * UC-046: Types e Interfaces
 * 
 * Definiciones para Auto Date Manager
 */

export interface AutoTask {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  createdDate?: string;
  doneDate?: string;
  cancelledDate?: string;
  tags: string[];
  blockLink?: string;
}

export interface DateChangeResult {
  success: boolean;
  task: AutoTask | null;
  previousDates?: {
    createdDate?: string;
    doneDate?: string;
    cancelledDate?: string;
  };
  newDates?: {
    createdDate?: string;
    doneDate?: string;
    cancelledDate?: string;
  };
  error?: string;
}

export interface DateValidationResult {
  valid: boolean;
  errors?: string[];
}

export default {
  AutoTask,
  DateChangeResult,
  DateValidationResult
};
