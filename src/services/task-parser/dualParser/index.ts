/**
 * UC-049: dualParser - Entry point
 */

export { DualParser } from './dualParser';
export type { DualParserConfig, DualParseResult, ParserEvent } from './types';

export default {
  DualParser: require('./dualParser').DualParser
};
