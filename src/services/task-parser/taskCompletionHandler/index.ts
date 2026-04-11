/**
 * UC-045: taskCompletionHandler - Entry point
 */

export { TaskCompletionHandler } from './taskCompletionHandler';
export type { CompletionAction, CompletionEvent, ActionResult, ExecutionRecord } from './types';

export default {
  TaskCompletionHandler: require('./taskCompletionHandler').TaskCompletionHandler
};
