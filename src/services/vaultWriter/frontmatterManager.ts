/**
 * UC-056: FrontmatterManager
 * 
 * Gestiona parsing, actualización y validación de frontmatter YAML
 */

import {
  FrontmatterData,
  ParsedContent,
  FrontmatterSchema,
  ValidationResult,
} from './types';

export class FrontmatterManager {
  /**
   * Parsear contenido para separar frontmatter y body
   * Espera formato YAML entre --- ---
   */
  parseFrontmatter(content: string): ParsedContent {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {
        frontmatter: {},
        body: content,
      };
    }

    const [, frontmatterStr, body] = match;
    const frontmatter = this.parseYAML(frontmatterStr);

    return {
      frontmatter,
      body: body || '',
    };
  }

  /**
   * Parsear YAML string simple (sin dependencias externas)
   */
  private parseYAML(yamlStr: string): FrontmatterData {
    const result: FrontmatterData = {};

    const lines = yamlStr.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const valueStr = line.substring(colonIndex + 1).trim();

      result[key] = this.parseValue(valueStr);
    }

    return result;
  }

  /**
   * Parsear valor YAML simple
   */
  private parseValue(valueStr: string): any {
    if (!valueStr) return null;

    // Booleanos
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;

    // Números
    if (/^\d+$/.test(valueStr)) return parseInt(valueStr);
    if (/^\d+\.\d+$/.test(valueStr)) return parseFloat(valueStr);

    // Arrays
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const content = valueStr.slice(1, -1);
      return content.split(',').map(item => item.trim());
    }

    // Strings
    return valueStr.replace(/^["']|["']$/g, '');
  }

  /**
   * Actualizar un campo específico en frontmatter
   */
  updateField(
    frontmatter: FrontmatterData,
    field: string,
    value: any
  ): FrontmatterData {
    return {
      ...frontmatter,
      [field]: value,
    };
  }

  /**
   * Actualizar múltiples campos
   */
  updateFields(
    frontmatter: FrontmatterData,
    updates: Record<string, any>
  ): FrontmatterData {
    return {
      ...frontmatter,
      ...updates,
    };
  }

  /**
   * Mergear dos objetos de frontmatter
   */
  mergeFrontmatter(
    existing: FrontmatterData,
    updates: FrontmatterData
  ): FrontmatterData {
    return {
      ...existing,
      ...updates,
    };
  }

  /**
   * Serializar frontmatter a formato YAML
   */
  serializeToYAML(frontmatter: FrontmatterData): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(frontmatter)) {
      if (value === null || value === undefined) {
        lines.push(`${key}:`);
      } else if (Array.isArray(value)) {
        lines.push(`${key}: [ ${value.join(', ')} ]`);
      } else if (typeof value === 'string' && value.includes(' ')) {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Serializar contenido completo con frontmatter
   */
  serializeContent(
    frontmatter: FrontmatterData,
    body: string
  ): string {
    const yaml = this.serializeToYAML(frontmatter);
    return `---\n${yaml}\n---\n\n${body}`;
  }

  /**
   * Validar frontmatter contra un esquema
   */
  validateSchema(
    frontmatter: FrontmatterData,
    schema: FrontmatterSchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [field, definition] of Object.entries(schema)) {
      const value = frontmatter[field];

      // Validar requeridos
      if (definition.required && (value === null || value === undefined)) {
        errors.push(`Campo requerido faltante: ${field}`);
        continue;
      }

      // Validar tipo si existe valor
      if (value !== null && value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== definition.type) {
          errors.push(
            `Campo ${field} debe ser ${definition.type}, recibió ${actualType}`
          );
        }
      }
    }

    // Advertencias por campos no schema
    for (const field of Object.keys(frontmatter)) {
      if (!schema[field]) {
        warnings.push(`Campo no definido en esquema: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validar que el frontmatter tenga estructura básica válida
   */
  validateBasic(frontmatter: FrontmatterData): ValidationResult {
    const errors: string[] = [];

    if (typeof frontmatter !== 'object') {
      errors.push('Frontmatter debe ser un objeto');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
