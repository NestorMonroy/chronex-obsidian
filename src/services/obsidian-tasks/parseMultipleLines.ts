/**
 * UC-040: parseMultipleLines
 * 
 * Parsea múltiples líneas de markdown (batch processing)
 */

import type { TaskLocation, ParsedTaskResult } from './types';
import { parseTaskFromLine } from './parseTaskFromLine';

/**
 * Parsea múltiples líneas en batch
 */
export function parseMultipleLines(
  lines: string[],
  baseLocation: TaskLocation,
  fallbackDate?: any
): ParsedTaskResult[] {
  return lines.map((line, index) => {
    const location: TaskLocation = {
      ...baseLocation,
      lineNumber: (baseLocation.lineNumber || 0) + index
    };
    
    return parseTaskFromLine(line, location, fallbackDate);
  });
}

export default parseMultipleLines;
