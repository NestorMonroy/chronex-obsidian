/**
 * UC-050: Types e Interfaces - Dependency Manager
 */

export interface Task {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dependencies?: string[];
  blocking?: string[];
  tags: string[];
}

export interface Dependency {
  taskId: string;
  dependsOn: string;
  type: 'blocks' | 'depends';
}

export interface DependencyResult {
  success: boolean;
  dependency?: Dependency | null;
  error?: string;
}

export interface ResolutionResult {
  success: boolean;
  canExecute: boolean;
  blockedBy?: string[];
  blocking?: string[];
  error?: string;
}

export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles?: Array<{ from: string; to: string }>;
}

export interface CriticalPathResult {
  success: boolean;
  criticalPath?: string[];
  criticalTasks?: string[];
  error?: string;
}

export interface ImpactResult {
  success: boolean;
  affected?: string[];
  error?: string;
}

export interface GraphResult {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
}

export default {
  Task,
  Dependency,
  DependencyResult,
  ResolutionResult,
  CycleDetectionResult,
  CriticalPathResult,
  ImpactResult,
  GraphResult
};
