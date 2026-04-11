/**
 * UC-SYS01: VALIDAR ENTRADA DE USUARIO
 * 
 * Sistema robusto de validación para todos los inputs de usuario.
 * 
 * @see /docs/specification/use-cases/UC-SYS01-validate-input.md
 */

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: any;
}

/**
 * Resultado de validación de múltiples campos
 */
export interface ValidationResults {
  valid: boolean;
  errors: Record<string, string>;
  validatedData?: Record<string, any>;
}

/**
 * Reglas de validación disponibles
 */
export enum ValidationRule {
  NAME = 'name',
  DESCRIPTION = 'description',
  ID_FORMAT = 'id_format',
  DATE_RANGE = 'date_range',
  PRIORITY = 'priority',
  STATUS = 'status',
  EMAIL = 'email',
  URL = 'url',
  DAYS_RANGE = 'days_range'
}

/**
 * Validador central para inputs de usuario
 */
export class Validator {
  // Regexes
  private static readonly REGEX_NAME = /^[a-zA-Z0-9\s\-áéíóú()]+$/;
  private static readonly REGEX_ID = /^[A-Z]+-\d{6}-[A-Z0-9]{5}$/;
  private static readonly REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly REGEX_URL = /^https?:\/\/.+/;

  // Constantes
  private static readonly MIN_NAME_LENGTH = 3;
  private static readonly MAX_NAME_LENGTH = 150;
  private static readonly MAX_DESCRIPTION_LENGTH = 1000;
  private static readonly MIN_DAYS = 1;
  private static readonly MAX_DAYS = 365;

  // Estados válidos por tipo de entidad
  private static readonly VALID_STATUS: Record<string, string[]> = {
    proyecto: ['pendiente', 'activo', 'pausado', 'completado', 'archivado'],
    objetivo: ['pendiente', 'activo', 'completado', 'archivado'],
    tarea: ['pendiente', 'en_progreso', 'bloqueada', 'completada', 'archivada'],
    documento: ['archivado', 'activo'],
    default: ['pendiente', 'activo', 'completado', 'archivado']
  };

  // Prioridades válidas
  private static readonly VALID_PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];

  /**
   * Validar nombre de proyecto/objetivo/tarea/repositorio
   * @param value Valor a validar
   * @returns Resultado de validación
   */
  static validateName(value: string | null | undefined): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'El nombre no puede estar vacío' };
    }

    const trimmed = value.trim();

    if (trimmed.length < this.MIN_NAME_LENGTH) {
      return {
        valid: false,
        error: `El nombre debe tener al menos ${this.MIN_NAME_LENGTH} caracteres`
      };
    }

    if (trimmed.length > this.MAX_NAME_LENGTH) {
      return {
        valid: false,
        error: `El nombre no puede exceder ${this.MAX_NAME_LENGTH} caracteres`
      };
    }

    if (!this.REGEX_NAME.test(trimmed)) {
      return {
        valid: false,
        error: 'El nombre contiene caracteres no permitidos. Permitidos: letras, números, espacios, guiones, paréntesis, acentos'
      };
    }

    return { valid: true, value: trimmed };
  }

  /**
   * Validar descripción (opcional, max 1000 caracteres)
   * @param value Valor a validar
   * @returns Resultado de validación
   */
  static validateDescription(value: string | null | undefined): ValidationResult {
    if (!value) return { valid: true, value: '' }; // Opcional

    if (value.length > this.MAX_DESCRIPTION_LENGTH) {
      return {
        valid: false,
        error: `La descripción no puede exceder ${this.MAX_DESCRIPTION_LENGTH} caracteres (actual: ${value.length})`
      };
    }

    return { valid: true, value };
  }

  /**
   * Validar formato de ID
   * @param value ID a validar (formato: TYPE-YYYYMM-XXXXX)
   * @returns Resultado de validación
   */
  static validateIdFormat(value: string | null | undefined): ValidationResult {
    if (!value) {
      return { valid: false, error: 'El ID no puede estar vacío' };
    }

    if (!this.REGEX_ID.test(value)) {
      return {
        valid: false,
        error: `Formato de ID inválido. Esperado: TYPE-YYYYMM-XXXXX (ejemplo: PROJ-202604-A1B2C), recibido: ${value}`
      };
    }

    return { valid: true, value };
  }

  /**
   * Validar rango de fechas
   * @param from Fecha de inicio
   * @param to Fecha de fin
   * @returns Resultado de validación
   */
  static validateDateRange(from: Date | string, to: Date | string): ValidationResult {
    try {
      const fromDate = typeof from === 'string' ? new Date(from) : from;
      const toDate = typeof to === 'string' ? new Date(to) : to;

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return {
          valid: false,
          error: 'Las fechas deben ser válidas'
        };
      }

      if (fromDate > toDate) {
        return {
          valid: false,
          error: 'La fecha de inicio no puede ser posterior a la de fin'
        };
      }

      return {
        valid: true,
        value: { from: fromDate, to: toDate }
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Error al validar fechas: ' + String(error)
      };
    }
  }

  /**
   * Validar rango de días (plazo)
   * @param days Número de días
   * @returns Resultado de validación
   */
  static validateDaysRange(days: number | string): ValidationResult {
    const daysNum = typeof days === 'string' ? parseInt(days) : days;

    if (isNaN(daysNum)) {
      return { valid: false, error: 'El plazo debe ser un número' };
    }

    if (daysNum < this.MIN_DAYS) {
      return {
        valid: false,
        error: `El plazo debe ser al menos ${this.MIN_DAYS} día`
      };
    }

    if (daysNum > this.MAX_DAYS) {
      return {
        valid: false,
        error: `El plazo no puede ser mayor a ${this.MAX_DAYS} días`
      };
    }

    return { valid: true, value: daysNum };
  }

  /**
   * Validar prioridad
   * @param value Valor a validar
   * @returns Resultado de validación
   */
  static validatePriority(value: string | null | undefined): ValidationResult {
    if (!value) {
      return { valid: false, error: 'La prioridad no puede estar vacía' };
    }

    const normalized = value.toUpperCase();

    if (!this.VALID_PRIORITIES.includes(normalized)) {
      return {
        valid: false,
        error: `Prioridad inválida. Debe ser una de: ${this.VALID_PRIORITIES.join(', ')}`
      };
    }

    return { valid: true, value: normalized };
  }

  /**
   * Validar estado según tipo de entidad
   * @param value Valor a validar
   * @param entityType Tipo de entidad (proyecto, objetivo, tarea, documento)
   * @returns Resultado de validación
   */
  static validateStatus(value: string | null | undefined, entityType: string): ValidationResult {
    if (!value) {
      return { valid: false, error: 'El estado no puede estar vacío' };
    }

    const normalized = value.toLowerCase();
    const allowed = this.VALID_STATUS[entityType] || this.VALID_STATUS.default;

    if (!allowed.includes(normalized)) {
      return {
        valid: false,
        error: `Estado inválido para ${entityType}. Permitidos: ${allowed.join(', ')}`
      };
    }

    return { valid: true, value: normalized };
  }

  /**
   * Validar email (futuro)
   * @param value Email a validar
   * @returns Resultado de validación
   */
  static validateEmail(value: string | null | undefined): ValidationResult {
    if (!value) {
      return { valid: true, value: '' }; // Opcional
    }

    if (!this.REGEX_EMAIL.test(value)) {
      return {
        valid: false,
        error: 'Formato de email inválido'
      };
    }

    return { valid: true, value };
  }

  /**
   * Validar URL (futuro)
   * @param value URL a validar
   * @returns Resultado de validación
   */
  static validateUrl(value: string | null | undefined): ValidationResult {
    if (!value) {
      return { valid: true, value: '' }; // Opcional
    }

    if (!this.REGEX_URL.test(value)) {
      return {
        valid: false,
        error: 'Formato de URL inválido (debe comenzar con http:// o https://)'
      };
    }

    return { valid: true, value };
  }

  /**
   * Validar múltiples campos a la vez
   * @param data Objeto con datos a validar
   * @param rules Objeto con reglas de validación
   * @returns Resultado de validación de todos los campos
   * 
   * @example
   * const result = Validator.validateAll(
   *   {
   *     nombre: 'Mi Proyecto',
   *     descripcion: 'Una buena descripción',
   *     prioridad: 'ALTA',
   *     dias: 30
   *   },
   *   {
   *     nombre: { type: 'name' },
   *     descripcion: { type: 'description' },
   *     prioridad: { type: 'priority' },
   *     dias: { type: 'days_range' }
   *   }
   * );
   */
  static validateAll(
    data: Record<string, any>,
    rules: Record<string, any>
  ): ValidationResults {
    const errors: Record<string, string> = {};
    const validatedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      let result: ValidationResult;

      try {
        switch (rule.type) {
          case ValidationRule.NAME:
            result = this.validateName(value);
            break;

          case ValidationRule.DESCRIPTION:
            result = this.validateDescription(value);
            break;

          case ValidationRule.ID_FORMAT:
            result = this.validateIdFormat(value);
            break;

          case ValidationRule.DATE_RANGE:
            result = this.validateDateRange(rule.from || value, rule.to);
            break;

          case ValidationRule.DAYS_RANGE:
            result = this.validateDaysRange(value);
            break;

          case ValidationRule.PRIORITY:
            result = this.validatePriority(value);
            break;

          case ValidationRule.STATUS:
            result = this.validateStatus(value, rule.entityType);
            break;

          case ValidationRule.EMAIL:
            result = this.validateEmail(value);
            break;

          case ValidationRule.URL:
            result = this.validateUrl(value);
            break;

          default:
            continue;
        }

        if (!result.valid) {
          errors[field] = result.error || 'Validación fallida';
        } else {
          validatedData[field] = result.value ?? value;
        }
      } catch (error) {
        errors[field] = 'Error durante la validación: ' + String(error);
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      validatedData: Object.keys(errors).length === 0 ? validatedData : undefined
    };
  }

  /**
   * Validar que un valor no es nulo/vacío
   * @param value Valor a validar
   * @param fieldName Nombre del campo (para mensaje de error)
   * @returns Resultado de validación
   */
  static validateRequired(value: any, fieldName: string = 'Campo'): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return {
        valid: false,
        error: `${fieldName} es requerido`
      };
    }

    return { valid: true, value };
  }

  /**
   * Validar que un valor es uno de los permitidos
   * @param value Valor a validar
   * @param allowed Array de valores permitidos
   * @param fieldName Nombre del campo
   * @returns Resultado de validación
   */
  static validateEnum(value: any, allowed: string[], fieldName: string = 'Campo'): ValidationResult {
    if (!allowed.includes(value)) {
      return {
        valid: false,
        error: `${fieldName} debe ser uno de: ${allowed.join(', ')}`
      };
    }

    return { valid: true, value };
  }
}

/**
 * Alias para uso más rápido
 */
export const validate = {
  name: (v: any) => Validator.validateName(v),
  description: (v: any) => Validator.validateDescription(v),
  id: (v: any) => Validator.validateIdFormat(v),
  priority: (v: any) => Validator.validatePriority(v),
  status: (v: any, type: string) => Validator.validateStatus(v, type),
  email: (v: any) => Validator.validateEmail(v),
  url: (v: any) => Validator.validateUrl(v),
  required: (v: any) => Validator.validateRequired(v),
  all: (data: any, rules: any) => Validator.validateAll(data, rules)
};
