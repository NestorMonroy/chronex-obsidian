/**
 * UC-056: ButtonResolver
 * 
 * Detecta referencias a botones, resuelve configuración e inyecta SVGs
 */

import {
  DetectedReference,
  ResolvedButton,
  ButtonRegistry,
  ResolveOptions,
} from './types';

export class ButtonResolver {
  /**
   * Detectar todas las referencias a botones en contenido
   */
  detectButtonReferences(content: string): DetectedReference[] {
    const regex = /`button-([a-z0-9-]+)`/gi;
    const references: DetectedReference[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      references.push({
        id: `button-${match[1].toLowerCase()}`,
        raw: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }

    return references;
  }

  /**
   * Obtener solo los IDs únicos de referencias
   */
  getUniqueReferenceIds(content: string): string[] {
    const references = this.detectButtonReferences(content);
    return [...new Set(references.map(r => r.id))];
  }

  /**
   * Resolver una referencia única: obtener configuración del registro
   */
  resolveReference(
    referenceId: string,
    registry: ButtonRegistry
  ): ResolvedButton | null {
    const entry = registry.buttons.get(referenceId);

    if (!entry) {
      return null;
    }

    return {
      id: referenceId,
      config: entry,
      svg: '', // Se llena después en injectSvgIntoReference
      markdown: this.generateMarkdown(entry),
    };
  }

  /**
   * Resolver todas las referencias en contenido
   */
  resolveAllReferences(
    content: string,
    registry: ButtonRegistry,
    options?: ResolveOptions
  ): Map<string, ResolvedButton> {
    const references = this.detectButtonReferences(content);
    const resolved = new Map<string, ResolvedButton>();

    for (const ref of references) {
      const button = this.resolveReference(ref.id, registry);
      if (button) {
        resolved.set(ref.id, button);
      }
    }

    return resolved;
  }

  /**
   * Generar markdown para un botón
   */
  private generateMarkdown(entry: any): string {
    return `[${entry.emoji || ''} ${entry.name}](button://${entry.action})`;
  }

  /**
   * Inyectar SVG en una referencia manteniendo backticks
   */
  injectSvgIntoReference(
    reference: string,
    svg: string,
    buttonName: string,
    emoji?: string
  ): string {
    // Mantener referencia por ID pero agregar SVG
    // Formato: `button-id` → [SVG emoji Name](button://action)
    const cleanId = reference.replace(/`/g, '');
    
    return `[${svg} ${emoji || ''} ${buttonName}](button://${cleanId})`;
  }

  /**
   * Reemplazar referencias en contenido con botones resueltos
   */
  replaceReferencesWithResolved(
    content: string,
    resolved: Map<string, ResolvedButton>,
    options?: ResolveOptions
  ): string {
    let result = content;

    for (const [refId, button] of resolved) {
      const regex = new RegExp(`\`${refId}\``, 'g');
      const replacement = this.generateMarkdown(button.config);
      result = result.replace(regex, replacement);
    }

    return result;
  }

  /**
   * Validar que todas las referencias existan en registro
   */
  validateReferencesExist(
    content: string,
    registry: ButtonRegistry
  ): {
    valid: boolean;
    missing: string[];
  } {
    const refIds = this.getUniqueReferenceIds(content);
    const missing: string[] = [];

    for (const id of refIds) {
      if (!registry.buttons.has(id)) {
        missing.push(id);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Obtener informe de resolución
   */
  getResolutionReport(
    content: string,
    registry: ButtonRegistry
  ): {
    total: number;
    unique: number;
    resolved: number;
    missing: string[];
  } {
    const references = this.detectButtonReferences(content);
    const uniqueIds = [...new Set(references.map(r => r.id))];
    const validation = this.validateReferencesExist(content, registry);

    let resolved = uniqueIds.length - validation.missing.length;

    return {
      total: references.length,
      unique: uniqueIds.length,
      resolved,
      missing: validation.missing,
    };
  }
}
