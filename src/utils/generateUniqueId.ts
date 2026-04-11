/**
 * UC-SYS02: GENERAR ID ÚNICO
 * 
 * Sistema de generación de IDs únicos garantizados usando Web Crypto API.
 * Formato: {TYPE}-{YYYYMM}-{XXXXX}
 * Ejemplo: PROJ-202604-A1B2C
 * 
 * @see /docs/specification/use-cases/UC-SYS02-generate-unique-id.md
 */

// Importar crypto dinámicamente para soportar tanto Node.js como navegador
let cryptoModule: any;

try {
  // En Node.js
  cryptoModule = require('crypto').webcrypto;
} catch {
  // En navegador
  cryptoModule = typeof window !== 'undefined' ? window.crypto : null;
}

/**
 * Tipos de ID por entidad
 */
export const ID_TYPES = {
  PROJECT: 'PROJ',
  OBJECTIVE: 'OBJ',
  TASK: 'TSK',
  DOCUMENT: 'DOC',
  REPOSITORY: 'REPO',
  KEY_RESULT: 'KR'
} as const;

export type IdType = typeof ID_TYPES[keyof typeof ID_TYPES];

/**
 * Generador de IDs únicos con garantía criptográfica
 */
export class IdGenerator {
  private static readonly CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /**
   * Generar componente aleatorio usando Web Crypto API
   * @param length Longitud del componente (default: 5)
   * @returns String de caracteres aleatorios
   */
  static generateRandomPart(length: number = 5): string {
    // Verificar disponibilidad de crypto API
    if (!cryptoModule) {
      throw new Error('Web Crypto API no disponible');
    }

    const chars = new Uint8Array(length);
    cryptoModule.getRandomValues(chars);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.CHARSET[chars[i] % this.CHARSET.length];
    }

    return result;
  }

  /**
   * Generar ID completo
   * @param type Tipo de ID (PROJ, OBJ, TSK, DOC, REPO, KR)
   * @returns ID en formato TYPE-YYYYMM-XXXXX
   * 
   * @example
   * IdGenerator.generate(ID_TYPES.PROJECT) → 'PROJ-202604-A1B2C'
   * IdGenerator.generate(ID_TYPES.DOCUMENT) → 'DOC-202604-K7M9N'
   */
  static generate(type: IdType): string {
    const yearMonth = this.getYearMonth();
    const randomPart = this.generateRandomPart();

    return `${type}-${yearMonth}-${randomPart}`;
  }

  /**
   * Generar múltiples IDs únicos
   * @param type Tipo de ID
   * @param count Cantidad de IDs a generar
   * @returns Array de IDs únicos
   */
  static generateMultiple(type: IdType, count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate(type));
    }
    return ids;
  }

  /**
   * Obtener timestamp en formato YYYYMM
   * @returns String YYYYMM (ejemplo: 202604)
   */
  private static getYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }

  /**
   * Validar formato de ID
   * @param id ID a validar
   * @returns true si el formato es válido
   */
  static isValidFormat(id: string): boolean {
    const regex = /^[A-Z]+-\d{6}-[A-Z0-9]{5}$/;
    return regex.test(id);
  }

  /**
   * Validar que múltiples IDs tienen formato válido
   * @param ids Array de IDs
   * @returns true si TODOS los IDs tienen formato válido
   */
  static areAllValid(ids: string[]): boolean {
    return ids.every(id => this.isValidFormat(id));
  }

  /**
   * Extraer tipo de un ID
   * @param id ID completo (PROJ-202604-A1B2C)
   * @returns Tipo (PROJ)
   * @throws Si el ID no es válido
   */
  static getTypeFromId(id: string): IdType {
    if (!this.isValidFormat(id)) {
      throw new Error(`ID inválido: ${id}`);
    }

    const parts = id.split('-');
    const type = parts[0];

    // Validar que es un tipo conocido
    if (!Object.values(ID_TYPES).includes(type as IdType)) {
      throw new Error(`Tipo de ID desconocido: ${type}`);
    }

    return type as IdType;
  }

  /**
   * Extraer fecha de creación de un ID
   * @param id ID completo
   * @returns Date aproximada (primer día del mes)
   * @throws Si el ID no es válido
   */
  static getDateFromId(id: string): Date {
    if (!this.isValidFormat(id)) {
      throw new Error(`ID inválido: ${id}`);
    }

    const parts = id.split('-');
    const yearMonth = parts[1]; // 202604

    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));

    return new Date(year, month - 1, 1);
  }
}

/**
 * Alias para uso más rápido
 */
export function generateId(type: IdType): string {
  return IdGenerator.generate(type);
}

/**
 * Alias para validación rápida
 */
export function isValidId(id: string): boolean {
  return IdGenerator.isValidFormat(id);
}
