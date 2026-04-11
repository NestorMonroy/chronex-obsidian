/**
 * UC-043: statusRegistry
 * 
 * Registro dinámico de statuses que permite:
 * - Consultar statuses
 * - Registrar statuses personalizados
 * - Mapear símbolos a nombres
 * - Validar statuses
 */

import type { Status, IStatusRegistry } from './types';

/**
 * Status Registry - Gestiona statuses de tareas
 */
export class StatusRegistry implements IStatusRegistry {
  private statuses: Map<string, Status> = new Map();
  private symbolToName: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultStatuses();
  }

  /**
   * Inicializar statuses por defecto
   */
  private initializeDefaultStatuses(): void {
    const defaults: Status[] = [
      {
        symbol: '[ ]',
        name: 'TODO',
        description: 'Tarea pendiente',
        emoji: '📋',
        color: '#808080',
        isFinal: false,
        isDefault: true
      },
      {
        symbol: '[x]',
        name: 'DONE',
        description: 'Tarea completada',
        emoji: '✅',
        color: '#4CAF50',
        isFinal: true,
        isDefault: true
      },
      {
        symbol: '[/]',
        name: 'IN_PROGRESS',
        description: 'Tarea en progreso',
        emoji: '🔄',
        color: '#2196F3',
        isFinal: false,
        isDefault: true
      },
      {
        symbol: '[-]',
        name: 'CANCELLED',
        description: 'Tarea cancelada',
        emoji: '❌',
        color: '#F44336',
        isFinal: true,
        isDefault: true
      },
      {
        symbol: '[>]',
        name: 'FORWARDED',
        description: 'Tarea delegada/pospuesta',
        emoji: '⏭️',
        color: '#FF9800',
        isFinal: false,
        isDefault: true
      }
    ];

    defaults.forEach(status => {
      this.statuses.set(status.name.toUpperCase(), status);
      this.symbolToName.set(status.symbol, status.name);
    });
  }

  /**
   * Obtener todos los statuses
   */
  getAllStatuses(): Status[] {
    return Array.from(this.statuses.values());
  }

  /**
   * Obtener status por nombre o símbolo
   */
  getStatus(nameOrSymbol: string): Status | undefined {
    if (!nameOrSymbol) return undefined;

    const cleanInput = nameOrSymbol.trim();

    // Buscar por nombre
    let status = this.statuses.get(cleanInput.toUpperCase());
    if (status) return status;

    // Buscar por símbolo
    const name = this.symbolToName.get(cleanInput);
    if (name) return this.statuses.get(name);

    return undefined;
  }

  /**
   * Validar si un status existe
   */
  validateStatus(name: any): boolean {
    if (!name || typeof name !== 'string') return false;

    const cleanName = name.trim().toUpperCase();
    return this.statuses.has(cleanName);
  }

  /**
   * Mapear símbolo a nombre
   */
  mapSymbolToName(symbol: string): string | undefined {
    if (!symbol) return undefined;

    return this.symbolToName.get(symbol);
  }

  /**
   * Mapear nombre a símbolo
   */
  mapNameToSymbol(name: string): string | undefined {
    if (!name) return undefined;

    const status = this.getStatus(name);
    return status?.symbol;
  }

  /**
   * ¿Es un status completado?
   */
  isStatusComplete(name: string): boolean {
    const status = this.getStatus(name);
    return status?.isFinal ?? false;
  }

  /**
   * Registrar status personalizado
   */
  registerStatus(status: Status): boolean {
    if (!status || !status.name || !status.symbol) {
      return false;
    }

    const upperName = status.name.toUpperCase();

    // No permitir duplicados
    if (this.statuses.has(upperName)) {
      return false;
    }

    // Registrar
    this.statuses.set(upperName, {
      ...status,
      name: upperName,
      isDefault: false
    });

    // Mapear símbolo
    this.symbolToName.set(status.symbol, upperName);

    // Mapear aliases
    if (status.aliases) {
      status.aliases.forEach(alias => {
        this.symbolToName.set(alias, upperName);
      });
    }

    return true;
  }

  /**
   * Desregistrar status personalizado
   */
  unregisterStatus(name: string): boolean {
    if (!name) return false;

    const upperName = name.toUpperCase();
    const status = this.statuses.get(upperName);

    // No permitir desregistrar por defecto
    if (status?.isDefault) {
      return false;
    }

    // No permitir desregistrar inexistente
    if (!status) {
      return false;
    }

    // Desregistrar
    this.statuses.delete(upperName);

    // Remover mapeo de símbolo
    this.symbolToName.delete(status.symbol);

    // Remover aliases
    if (status.aliases) {
      status.aliases.forEach(alias => {
        this.symbolToName.delete(alias);
      });
    }

    return true;
  }
}

export default StatusRegistry;
