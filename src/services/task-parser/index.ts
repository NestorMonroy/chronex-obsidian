/**
 * UC-040: obsidian-tasks - Entry point
 * 
 * Exports principales del sistema de parsing
 */

export { parseTaskFromLine } from './parseTaskFromLine';
export { validateParsedTask } from './validateParsedTask';
export { parseMultipleLines } from './parseMultipleLines';

export type {
  TaskLocation,
  TaskStatus,
  TaskPriority,
  ParsedTask,
  ValidationResult,
  ParsedTaskResult
} from './types';

export default {
  parseTaskFromLine: require('./parseTaskFromLine').default,
  validateParsedTask: require('./validateParsedTask').default,
  parseMultipleLines: require('./parseMultipleLines').default
};
