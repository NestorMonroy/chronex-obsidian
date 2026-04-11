/**
 * UC-055: Types e Interfaces - TaskCollector + TemplateEngine
 */

export interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  dueDate?: string;
  createdDate: string;
  tags: string[];
  filePath: string;
}

export interface DateFilter {
  type: 'today' | 'week' | 'month' | 'overdue';
  customDate?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionPercentage: number;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
}

export interface TemplateVariable {
  name: string;
  value?: string;
  resolver: () => string;
  type: 'static' | 'dynamic' | 'computed';
}

export interface TemplateContext {
  variables: Record<string, string>;
  folderPath: string;
  fileName: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface IncludeValidation {
  valid: boolean;
  path: string;
  exists: boolean;
}

export default {
  Task,
  DateFilter,
  TaskStats,
  TemplateVariable,
  TemplateContext,
  ValidationResult,
  IncludeValidation
};
