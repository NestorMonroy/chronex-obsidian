/**
 * UC-047: Types e Interfaces
 */

export interface ScheduledTask {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dueDate?: string;
  scheduledDate?: string;
  createdDate?: string;
  tags: string[];
}

export interface SchedulingResult {
  success: boolean;
  task: ScheduledTask | null;
  previousScheduledDate?: string;
  newScheduledDate?: string;
  warnings?: string[];
  error?: string;
}

export interface ParseResult {
  success: boolean;
  scheduledDate: string | null;
  error?: string;
}

export default { ScheduledTask, SchedulingResult, ParseResult };
