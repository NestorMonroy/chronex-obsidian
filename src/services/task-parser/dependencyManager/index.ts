/**
 * UC-050: dependencyManager - Entry point
 */

export { DependencyManager } from './dependencyManager';
export type {
  Task,
  Dependency,
  DependencyResult,
  ResolutionResult,
  CycleDetectionResult,
  CriticalPathResult,
  ImpactResult,
  GraphResult
} from './types';

export default {
  DependencyManager: require('./dependencyManager').DependencyManager
};
