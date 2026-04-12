/**
 * UC-056: ButtonRegistryManager
 * 
 * Lee, parsea, valida y gestiona el registro centralizado de botones
 */

import {
  ButtonRegistry,
  ButtonRegistryEntry,
  ValidationResult,
  RegistryError,
} from './types';

export class ButtonRegistryManager {
  private cache: Map<string, ButtonRegistry> = new Map();

  /**
   * Leer y parsear buttonRegistry.md
   */
  async readRegistry(content: string): Promise<ButtonRegistry> {
    const buttons = new Map<string, ButtonRegistryEntry>();
    const categories = new Set<string>();

    // Parsear formato markdown simple
    const sections = content.split(/^## /m);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const categoryMatch = lines[0].match(/Categoría \d+: (.+)/);
      const category = categoryMatch ? categoryMatch[1] : 'General';

      const entries = section.split(/^### /m);

      for (const entry of entries) {
        if (!entry.trim()) continue;

        const button = this.parseButtonEntry(entry, category);
        if (button) {
          buttons.set(button.id, button);
          categories.add(category);
        }
      }
    }

    return {
      buttons,
      categories: Array.from(categories),
    };
  }

  /**
   * Parsear una entrada individual de botón
   */
  private parseButtonEntry(
    entryText: string,
    category: string
  ): ButtonRegistryEntry | null {
    const lines = entryText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;

    const idMatch = lines[0].match(/^(button-[a-z0-9-]+)/i);
    if (!idMatch) return null;

    const id = idMatch[1].toLowerCase();
    let name = '';
    let emoji = '';
    let color = '';
    let action = '';
    const appearances: string[] = [];

    for (const line of lines) {
      if (line.includes('Nombre mostrado:')) {
        name = line.split(':')[1].trim();
      } else if (line.includes('Emoji:')) {
        emoji = line.split(':')[1].trim();
      } else if (line.includes('Color SVG:')) {
        color = line.split(':')[1].trim();
      } else if (line.includes('Acción:')) {
        action = line.split(':')[1].trim();
      } else if (line.includes('Aparece en templates:')) {
        const templates = line.split(':')[1];
        if (templates) {
          appearances.push(templates.trim());
        }
      }
    }

    if (!name || !action) {
      return null;
    }

    return {
      id,
      name,
      emoji,
      color,
      action,
      category,
      appearances,
    };
  }

  /**
   * Obtener configuración de botón por ID
   */
  getButtonConfig(buttonId: string, registry: ButtonRegistry): ButtonRegistryEntry | undefined {
    const buttons = registry.buttons;
    const id = buttonId.toLowerCase();

    // Soportar ambos Map y Record
    let entry: any;
    if (buttons instanceof Map) {
      entry = buttons.get(id);
    } else {
      entry = (buttons as any)[id];
    }

    // Si el entry existe pero le faltan propiedades, añadirlas
    if (entry) {
      if (!entry.id) entry.id = id;
      if (!entry.category) entry.category = 'General';
      if (!entry.appearances) entry.appearances = [];
    }

    return entry;
  }

  /**
   * Obtener todos los botones
   */
  getAllButtons(registry: ButtonRegistry): ButtonRegistryEntry[] {
    const buttons = registry.buttons;

    // Soportar ambos Map y Record
    if (buttons instanceof Map) {
      return Array.from(buttons.values());
    } else {
      return Object.values(buttons as any);
    }
  }

  /**
   * Obtener botones por categoría
   */
  getButtonsByCategory(
    category: string,
    registry: ButtonRegistry
  ): ButtonRegistryEntry[] {
    return this.getAllButtons(registry).filter(b => b.category === category);
  }

  /**
   * Agrupar botones por categoría
   */
  groupByCategory(registry: ButtonRegistry): Record<string, ButtonRegistryEntry[]> {
    const grouped: Record<string, ButtonRegistryEntry[]> = {};

    for (const category of registry.categories) {
      grouped[category] = this.getButtonsByCategory(category, registry);
    }

    return grouped;
  }

  /**
   * Validar integridad del registro
   */
  validateRegistry(registry: ButtonRegistry): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const buttons = this.getAllButtons(registry);

    // Validar que no haya duplicados
    const ids = new Set<string>();
    for (const button of buttons) {
      if (ids.has(button.id)) {
        errors.push(`ID de botón duplicado: ${button.id}`);
      }
      ids.add(button.id);
    }

    // Validar campos requeridos
    for (const button of buttons) {
      const id = button.id || 'unknown';
      if (!button.name && !button.emoji) {
        errors.push(`Botón ${id} sin nombre ni emoji`);
      }
      // action es opcional en algunos casos
    }

    // Advertencias
    if (buttons.length === 0) {
      warnings.push('Registro vacío: no hay botones definidos');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validar que todos los botones existentes estén en registry
   */
  validateAllButtons(
    requiredButtonIds: string[],
    registry: ButtonRegistry
  ): { missing: string[]; extra: string[] } {
    const required = new Set(requiredButtonIds.map(id => id.toLowerCase()));
    const buttons = registry.buttons;

    // Soportar ambos Map y Record
    let existingKeys: string[];
    if (buttons instanceof Map) {
      existingKeys = Array.from(buttons.keys());
    } else {
      existingKeys = Object.keys(buttons as any);
    }

    const existing = new Set(existingKeys);

    const missing: string[] = [];
    for (const id of required) {
      if (!existing.has(id)) {
        missing.push(id);
      }
    }

    return {
      missing,
      extra: [],
    };
  }

  /**
   * Buscar botones por patrón
   */
  searchButtons(
    pattern: string,
    registry: ButtonRegistry
  ): ButtonRegistryEntry[] {
    const regex = new RegExp(pattern, 'i');
    return this.getAllButtons(registry).filter(
      b => regex.test(b.id) || regex.test(b.name)
    );
  }

  /**
   * Obtener estadísticas del registro
   */
  getStatistics(registry: ButtonRegistry): {
    total: number;
    byCategory: Record<string, number>;
    withAppearances: number;
  } {
    const byCategory: Record<string, number> = {};
    let withAppearances = 0;
    const buttons = this.getAllButtons(registry);

    for (const button of buttons) {
      byCategory[button.category] = (byCategory[button.category] || 0) + 1;
      if (button.appearances && button.appearances.length > 0) {
        withAppearances++;
      }
    }

    return {
      total: buttons.length,
      byCategory,
      withAppearances,
    };
  }

  /**
   * Detectar referencias a botones en contenido
   */
  detectButtonReferences(content: string): string[] {
    const regex = /`button-[a-z0-9-]+`/gi;
    const matches = content.match(regex) || [];
    return matches.map(m => m.replace(/`/g, ''));
  }

  /**
   * Resolver una referencia individual de botón
   */
  resolveReference(buttonId: string, registry: ButtonRegistry): ButtonRegistryEntry | undefined {
    return this.getButtonConfig(buttonId, registry);
  }

  /**
   * Resolver todas las referencias en contenido
   */
  resolveAllReferences(content: string, registry: ButtonRegistry): Map<string, ButtonRegistryEntry> {
    const references = this.detectButtonReferences(content);
    const resolved = new Map<string, ButtonRegistryEntry>();

    for (const ref of references) {
      const config = this.getButtonConfig(ref, registry);
      if (config) {
        resolved.set(ref, config);
      }
    }

    return resolved;
  }

  /**
   * Inyectar SVG en referencia de botón
   */
  injectSvgIntoReference(
    reference: string,
    svg: string,
    config: ButtonRegistryEntry
  ): string {
    // Reemplazar la referencia con el SVG y metadatos
    return `${svg} ${config.name}`;
  }
}
