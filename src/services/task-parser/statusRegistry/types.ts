/**
 * UC-043: Types e Interfaces
 * 
 * Definiciones para Status Registry
 */

/**
 * Definición de un Status
 */
export interface Status {
  // Identificadores
  symbol: string;      // [ ], [x], [/], [-], [>] - símbolo markdown
  name: string;        // TODO, DONE, IN_PROGRESS - nombre único
  
  // Información
  description?: string;
  emoji?: string;      // ✅, 📋, 🔄, ❌, ⏭️ - para UI
  color?: string;      // Hex: #FF5733 - para UI
  
  // Comportamiento
  isFinal?: boolean;   // ¿La tarea está completa?
  aliases?: string[];  // Símbolos alternativos que mapean a este status
  
  // Sistema
  isDefault?: boolean; // ¿Es status por defecto? (no se puede desregistrar)
}

/**
 * Registry de Status
 */
export interface IStatusRegistry {
  // Consultar
  getAllStatuses(): Status[];
  getStatus(nameOrSymbol: string): Status | undefined;
  validateStatus(name: string): boolean;
  isStatusComplete(name: string): boolean;
  
  // Mapear
  mapSymbolToName(symbol: string): string | undefined;
  mapNameToSymbol(name: string): string | undefined;
  
  // Registrar personalizado
  registerStatus(status: Status): boolean;
  unregisterStatus(name: string): boolean;
}

