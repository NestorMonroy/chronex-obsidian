/**
 * UC-055: TemplateEngine
 * 
 * Motor para procesar templates con:
 * - Variables dinámicas {{VALUE:...}}
 * - Includes <% tp.file.include(...) %>
 * - Validación de templates
 * - Mixins QuickAdd + Templater
 */

import type {
  TemplateVariable,
  TemplateContext,
  ValidationResult,
  IncludeValidation
} from './types';

export class TemplateEngine {
  private variables = new Map<string, () => string>();
  private registeredUIDs = new Set<string>();
  private commonFiles = new Set(['common/templateMetadata', 'common/templateNotes', 'common/templateTags']);

  constructor() {
    this.registerDefaultVariables();
  }

  /**
   * Registrar variables por defecto
   */
  private registerDefaultVariables(): void {
    this.variables.set('uniqueId', () => this.generateUniqueId());
    this.variables.set('currentDate', () => new Date().toISOString().split('T')[0]);
    this.variables.set('fileName', () => '');
    this.variables.set('folderName', () => '');
    this.variables.set('alias', () => '');
    this.variables.set('priority', () => 'MEDIA');
    this.variables.set('dueDate', () => '');
  }

  /**
   * Generar ID único
   */
  private generateUniqueId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registrar variable personalizada
   */
  registerVariable(name: string, resolver: () => string): void {
    this.variables.set(name, resolver);
  }

  /**
   * Registrar UID usado
   */
  registerUID(uid: string): void {
    this.registeredUIDs.add(uid);
  }

  /**
   * Resolver una variable individual
   */
  resolveVariable(varName: string, context: TemplateContext): string {
    // Primero intentar desde el contexto
    if (context.variables[varName]) {
      return context.variables[varName];
    }

    // Luego intentar desde los resolvers registrados
    const resolver = this.variables.get(varName);
    if (resolver) {
      return resolver();
    }

    return '';
  }

  /**
   * Procesar template - resolver {{VALUE:...}}
   */
  processTemplate(template: string, context: TemplateContext): string {
    let result = template;

    // Buscar todos {{VALUE:varName}}
    const varPattern = /\{\{VALUE:(\w+)\}\}/g;
    result = result.replace(varPattern, (match, varName) => {
      const resolved = this.resolveVariable(varName, context);
      // Si no se resolvió a nada, mantener la sintaxis original
      return resolved === '' ? match : resolved;
    });

    return result;
  }

  /**
   * Procesar includes - <% tp.file.include(...) %>
   */
  processIncludes(template: string): string {
    // Validar que los includes existan
    const includePattern = /<% tp\.file\.include\(\[\[(.+?)\]\]\) %>/g;
    let match;

    while ((match = includePattern.exec(template)) !== null) {
      const includePath = match[1];
      const validation = this.validateInclude(includePath);

      if (!validation.valid) {
        console.warn(`Invalid include: ${includePath}`);
      }
    }

    return template;
  }

  /**
   * Validar que un include existe
   */
  validateInclude(includePath: string): IncludeValidation {
    const exists = this.commonFiles.has(includePath);

    return {
      valid: exists,
      path: includePath,
      exists
    };
  }

  /**
   * Validar UID único
   */
  validateUID(uid: string): ValidationResult {
    if (this.registeredUIDs.has(uid)) {
      return {
        valid: false,
        errors: [`UID duplicado: ${uid}`]
      };
    }

    // Registrarlo para futuras validaciones
    this.registeredUIDs.add(uid);

    return {
      valid: true
    };
  }

  /**
   * Validar formato de alias
   */
  validateAlias(alias: string): ValidationResult {
    // Solo alphanumericos, guiones y guiones bajos
    const aliasPattern = /^[a-zA-Z0-9\-_]+$/;

    if (!aliasPattern.test(alias)) {
      return {
        valid: false,
        errors: [`Alias inválido: ${alias}. Solo alphanumericos, guiones y guiones bajos.`]
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Validar formato de tags
   */
  validateTags(tags: string[]): ValidationResult {
    const errors: string[] = [];
    const tagPattern = /^[a-zA-Z0-9\-_]+$/;

    for (const tag of tags) {
      if (!tagPattern.test(tag)) {
        errors.push(`Tag inválido: ${tag}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validar frontmatter completo
   */
  validateFrontmatter(fm: Record<string, any>): ValidationResult {
    const required = ['UID', 'type', 'date'];
    const errors: string[] = [];

    for (const field of required) {
      if (!fm[field]) {
        errors.push(`Campo requerido falta: ${field}`);
      }
    }

    // Validar UID
    if (fm.UID) {
      const uidResult = this.validateUID(fm.UID);
      if (!uidResult.valid) {
        errors.push(...(uidResult.errors || []));
      }
    }

    // Validar alias si existe
    if (fm.aliases && Array.isArray(fm.aliases)) {
      for (const alias of fm.aliases) {
        const aliasResult = this.validateAlias(alias);
        if (!aliasResult.valid) {
          errors.push(...(aliasResult.errors || []));
        }
      }
    }

    // Validar tags si existen
    if (fm.tags && Array.isArray(fm.tags)) {
      const tagsResult = this.validateTags(fm.tags);
      if (!tagsResult.valid) {
        errors.push(...(tagsResult.errors || []));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Procesar mixins - {{VALUE:...}} + <% %>
   */
  processMixins(template: string, context: TemplateContext): string {
    // 1. Primero procesar variables {{VALUE:...}}
    let result = this.processTemplate(template, context);

    // 2. Luego procesar includes
    result = this.processIncludes(result);

    // 3. Dejar Templater functions como están
    return result;
  }

  /**
   * Validar template completo
   */
  validateTemplate(template: string): ValidationResult {
    const errors: string[] = [];

    // Extraer frontmatter
    const fmMatch = template.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      errors.push('Frontmatter no encontrado');
      return { valid: false, errors };
    }

    // Parsear frontmatter (simple)
    const fmText = fmMatch[1];
    const fm: Record<string, any> = {};

    const lines = fmText.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        fm[match[1]] = match[2];
      }
    }

    // Validar frontmatter
    const fmResult = this.validateFrontmatter(fm);
    if (!fmResult.valid) {
      errors.push(...(fmResult.errors || []));
    }

    // Validar includes
    const includePattern = /<% tp\.file\.include\(\[\[(.+?)\]\]\) %>/g;
    let match;

    while ((match = includePattern.exec(template)) !== null) {
      const includePath = match[1];
      const validation = this.validateInclude(includePath);

      if (!validation.valid) {
        errors.push(`Include inválido: ${includePath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

export default TemplateEngine;
