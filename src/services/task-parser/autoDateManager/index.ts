/**
 * UC-046: autoDateManager - Entry point
 */

export { AutoDateManager } from './autoDateManager';
export type { AutoTask, DateChangeResult, DateValidationResult } from './types';

export default {
  AutoDateManager: require('./autoDateManager').AutoDateManager
};
