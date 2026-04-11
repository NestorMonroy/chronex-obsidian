/**
 * UC-049: Types e Interfaces
 * 
 * Definiciones para Dual Parser
 */

export interface DualParserConfig {
  preferObsidianTasks?: boolean;  // ¿Preferir obsidian-tasks?
  fallbackOnError?: boolean;       // ¿Usar fallback si error?
  validateResults?: boolean;       // ¿Validar resultado?
  logSource?: boolean;             // ¿Log de qué parser usó?
}

export interface DualParseResult {
  success: boolean;
  task?: any;
  source: 'obsidian-tasks' | 'fallback';
  error?: string;
  warnings?: string[];
}

export interface ParserEvent {
  timestamp: string;
  type: 'parse' | 'fallback' | 'error' | 'validation';
  source: 'obsidian-tasks' | 'fallback';
  message: string;
}

export default {
  DualParserConfig,
  DualParseResult,
  ParserEvent
};
