/**
 * UC-049: dualParser
 * 
 * Parser dual que permite usar obsidian-tasks y nuestro sistema en paralelo.
 * Migración gradual sin romper tareas existentes.
 */

import type { DualParserConfig, DualParseResult, ParserEvent } from './types';

const parseTaskFromLine = require('../parseTaskFromLine').parseTaskFromLine;
const validateParsedTask = require('../validateParsedTask').validateParsedTask;
const parseMultipleLines = require('../parseMultipleLines').parseMultipleLines;

/**
 * Dual Parser - compatibilidad obsidian-tasks + fallback
 */
export class DualParser {
  private config: DualParserConfig = {
    preferObsidianTasks: false,
    fallbackOnError: true,
    validateResults: true,
    logSource: false
  };

  private events: ParserEvent[] = [];
  private maxEvents: number = 1000;

  /**
   * Obtener configuración actual
   */
  getConfig(): DualParserConfig {
    return { ...this.config };
  }

  /**
   * Establecer configuración
   */
  setConfig(newConfig: Partial<DualParserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Resetear configuración a valores por defecto
   */
  resetConfig(): void {
    this.config = {
      preferObsidianTasks: false,
      fallbackOnError: true,
      validateResults: true,
      logSource: false
    };
  }

  /**
   * Parsear con fallback automático
   */
  parseWithFallback(
    line: string | null | undefined,
    location: any
  ): DualParseResult {
    // Validar input
    if (!line || typeof line !== 'string') {
      return {
        success: false,
        source: 'fallback',
        error: 'Input must be a non-empty string'
      };
    }

    try {
      // Intentar con preferencia configurada
      if (this.config.preferObsidianTasks) {
        // Preferir obsidian-tasks (si está disponible)
        // Por ahora, fallback es el disponible
        return this.parseWithFallbackDirect(line, location);
      } else {
        // Usar fallback directamente
        return this.parseWithFallbackDirect(line, location);
      }
    } catch (error) {
      if (this.config.fallbackOnError) {
        // Intentar fallback
        return this.parseWithFallbackDirect(line, location);
      } else {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logEvent('error', 'fallback', `Error: ${errorMsg}`);
        return {
          success: false,
          source: 'fallback',
          error: errorMsg
        };
      }
    }
  }

  /**
   * Parsear múltiples líneas con fallback
   */
  parseMultipleWithFallback(
    lines: string[],
    baseLocation: any
  ): DualParseResult[] {
    if (!Array.isArray(lines)) {
      return [];
    }

    return lines.map((line, index) => {
      const location = {
        ...baseLocation,
        lineNumber: (baseLocation.lineNumber || 0) + index
      };

      return this.parseWithFallback(line, location);
    });
  }

  /**
   * Parsear con fallback directo
   */
  private parseWithFallbackDirect(
    line: string,
    location: any
  ): DualParseResult {
    try {
      // Usar fallback (parseTaskFromLine)
      const result = parseTaskFromLine(line, location);

      // Validar si está configurado
      if (this.config.validateResults && result.success && result.task) {
        const validation = validateParsedTask(result.task);
        if (!validation.valid) {
          this.logEvent(
            'validation',
            'fallback',
            `Validation failed: ${validation.errors.join(', ')}`
          );
        }
      }

      // Log si está configurado
      if (this.config.logSource) {
        this.logEvent('parse', 'fallback', `Parsed: ${line.substring(0, 50)}`);
      }

      return {
        ...result,
        source: 'fallback'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logEvent('error', 'fallback', errorMsg);

      return {
        success: false,
        source: 'fallback',
        error: errorMsg
      };
    }
  }

  /**
   * Registrar evento
   */
  private logEvent(
    type: 'parse' | 'fallback' | 'error' | 'validation',
    source: 'obsidian-tasks' | 'fallback',
    message: string
  ): void {
    const event: ParserEvent = {
      timestamp: new Date().toISOString(),
      type,
      source,
      message
    };

    this.events.push(event);

    // Limitar tamaño
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log a consola si está habilitado
    if (this.config.logSource && type !== 'error') {
      console.log(`[${source}] ${message}`);
    }
  }

  /**
   * Obtener eventos registrados
   */
  getEvents(): ParserEvent[] {
    return [...this.events];
  }

  /**
   * Limpiar eventos
   */
  clearEvents(): void {
    this.events = [];
  }
}

export default DualParser;
