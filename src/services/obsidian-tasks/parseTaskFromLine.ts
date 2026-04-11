/**
 * UC-040: parseTaskFromLine
 * 
 * Parsea una línea markdown a un objeto Task
 */

import type {
  TaskLocation,
  TaskStatus,
  TaskPriority,
  ParsedTask,
  ParsedTaskResult
} from './types';

/**
 * Parsea una línea de markdown a un objeto Task
 */
export function parseTaskFromLine(
  line: string | null | undefined,
  taskLocation: TaskLocation,
  fallbackDate?: any
): ParsedTaskResult {
  const startTime = performance.now();

  try {
    // Validar input
    if (!line || typeof line !== 'string') {
      return {
        success: false,
        error: 'Input must be a non-empty string',
        metadata: {
          filePath: taskLocation?.path,
          lineNumber: taskLocation?.lineNumber,
          parsedAt: new Date().toISOString(),
          source: 'fallback'
        }
      };
    }

    // Trim la línea
    const trimmedLine = line.trim();

    // Validar que parece una tarea
    if (!isValidTaskLine(trimmedLine)) {
      return {
        success: false,
        error: 'Line does not appear to be a valid task (must start with - or * and contain [ ])',
        metadata: {
          filePath: taskLocation?.path,
          lineNumber: taskLocation?.lineNumber,
          parsedAt: new Date().toISOString(),
          source: 'fallback'
        }
      };
    }

    // Parsear
    const task = parseTaskInternal(trimmedLine, taskLocation);
    
    const duration = performance.now() - startTime;

    return {
      success: true,
      task,
      metadata: {
        filePath: taskLocation?.path,
        lineNumber: taskLocation?.lineNumber,
        parsedAt: new Date().toISOString(),
        source: 'fallback'
      }
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: `Parsing error: ${errorMsg}`,
      metadata: {
        filePath: taskLocation?.path,
        lineNumber: taskLocation?.lineNumber,
        parsedAt: new Date().toISOString(),
        source: 'fallback'
      }
    };
  }
}

/**
 * Valida si una línea parece ser una tarea válida
 */
function isValidTaskLine(line: string): boolean {
  // Regex para detectar task markdown: "- [ ]", "- [x]", "* [ ]", etc.
  const taskRegex = /^[\s]*[-*]\s+\[.\]/;
  return taskRegex.test(line);
}

/**
 * Parseo interno - extrae propiedades del markdown
 */
function parseTaskInternal(
  line: string,
  taskLocation: TaskLocation
): ParsedTask {
  const warnings: string[] = [];

  // 1. Extraer status
  const statusMatch = line.match(/\[(.)\]/);
  const statusChar = statusMatch ? statusMatch[1] : ' ';

  // 2. Extraer descripción
  const descriptionMatch = line.match(/\]\s+(.+?)(?:\s+[📅🗓️⏫⏬#^]|$)/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  if (!description) {
    warnings.push('Task description is empty');
  }

  // 3. Extraer fecha due (📅)
  const dueDateMatch = line.match(/📅\s+(\d{4}-\d{2}-\d{2})/);
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;

  // 4. Extraer fecha scheduled (🗓️)
  const scheduledDateMatch = line.match(/🗓️\s+(\d{4}-\d{2}-\d{2})/);
  const scheduledDate = scheduledDateMatch ? scheduledDateMatch[1] : undefined;

  // 5. Extraer prioridad
  let priority: TaskPriority = 'MEDIA'; // Default
  if (line.includes('⏫')) {
    priority = 'ALTA';
  } else if (line.includes('⏬')) {
    priority = 'BAJA';
  }

  // 6. Extraer tags
  const tagMatches = line.match(/#[\w-]+/g) || [];
  const tags = tagMatches.map(tag => tag.substring(1)); // Remove #

  // 7. Extraer block link
  const blockLinkMatch = line.match(/\^([\w-]+)/);
  const blockLink = blockLinkMatch ? `^${blockLinkMatch[1]}` : undefined;

  // 8. Construir objeto tarea
  const task: ParsedTask = {
    description,
    status: statusCharToStatus(statusChar),
    priority,
    tags,
    dueDate,
    scheduledDate,
    blockLink,
    filePath: taskLocation.path,
    lineNumber: taskLocation.lineNumber,
    originalLine: line,
    parseSource: 'fallback'
  };

  return task;
}

/**
 * Convierte carácter de status a tipo Status
 */
function statusCharToStatus(char: string): TaskStatus {
  switch (char.toLowerCase()) {
    case 'x':
      return 'DONE';
    case '/':
      return 'IN_PROGRESS';
    case '>':
      return 'FORWARDED';
    case '-':
      return 'CANCELLED';
    case ' ':
    default:
      return 'TODO';
  }
}

export default parseTaskFromLine;
