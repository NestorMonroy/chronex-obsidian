/**
 * UC-041: recurrenceManager - Entry point
 */

export { RecurrenceManager } from './recurrenceManager';
export type {
  RecurrentTask,
  TaskInstance,
  RecurrenceResult,
  ExpandResult,
  RescheduleResult,
  ValidationResult
} from './types';

export default {
  RecurrenceManager: require('./recurrenceManager').RecurrenceManager
};
