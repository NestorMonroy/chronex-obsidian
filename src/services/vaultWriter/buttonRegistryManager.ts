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
    return registry.buttons.get(buttonId.toLowerCase());
  }

  /**
   * Obtener todos los botones
   */
  getAllButtons(registry: ButtonRegistry): ButtonRegistryEntry[] {
    return Array.from(registry.buttons.values());
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

    // Validar que no haya duplicados
    const ids = new Set<string>();
    for (const button of registry.buttons.values()) {
      if (ids.has(button.id)) {
        errors.push(`ID de botón duplicado: ${button.id}`);
      }
      ids.add(button.id);
    }

    // Validar campos requeridos
    for (const button of registry.buttons.values()) {
      if (!button.name) {
        errors.push(`Botón ${button.id} sin nombre`);
      }
      if (!button.action) {
        errors.push(`Botón ${button.id} sin acción`);
      }
    }

    // Advertencias
    if (registry.buttons.size === 0) {
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
    const existing = new Set(Array.from(registry.buttons.keys()));

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

    for (const button of registry.buttons.values()) {
      byCategory[button.category] = (byCategory[button.category] || 0) + 1;
      if (button.appearances && button.appearances.length > 0) {
        withAppearances++;
      }
    }

    return {
      total: registry.buttons.size,
      byCategory,
      withAppearances,
    };
  }
}
