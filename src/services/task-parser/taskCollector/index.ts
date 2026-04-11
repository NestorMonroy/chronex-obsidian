/**
 * UC-055: taskCollector - Entry point
 */

export { TaskCollector } from './taskCollector';
export { TemplateEngine } from './templateEngine';
export type {
  Task,
  DateFilter,
  TaskStats,
  TemplateVariable,
  TemplateContext,
  ValidationResult,
  IncludeValidation
} from './types';

export default {
  TaskCollector: require('./taskCollector').TaskCollector,
  TemplateEngine: require('./templateEngine').TemplateEngine
};
