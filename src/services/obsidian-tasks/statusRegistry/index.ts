/**
 * UC-043: statusRegistry - Entry point
 */

export { StatusRegistry } from './statusRegistry';
export type { Status, IStatusRegistry } from './types';

export default {
  StatusRegistry: require('./statusRegistry').StatusRegistry
};
