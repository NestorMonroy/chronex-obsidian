/**
 * UC-041: Types e Interfaces
 */

export interface RecurrentTask {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  scheduledDate?: string;
  recurrence?: string;
  recurrenceRule?: string;
  tags: string[];
}

export interface TaskInstance {
  originalId: string;
  instanceId: string;
  dueDate: string;
  scheduledDate?: string;
  occurrenceIndex: number;
}

export interface RecurrenceResult {
  success: boolean;
  recurrenceRule?: string | null;
  frequency?: string;
  task?: RecurrentTask;
  error?: string;
}

export interface ExpandResult {
  success: boolean;
  instances?: TaskInstance[];
  error?: string;
}

export interface RescheduleResult {
  success: boolean;
  instance?: TaskInstance;
  nextInstance?: TaskInstance;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export default {
  RecurrentTask,
  TaskInstance,
  RecurrenceResult,
  ExpandResult,
  RescheduleResult,
  ValidationResult
};
