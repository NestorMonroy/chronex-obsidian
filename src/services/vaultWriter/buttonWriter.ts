/**
 * UC-056: ButtonWriter
 * 
 * Inserta botones en archivos, renderiza con SVGs, y valida configuración
 */

import { ButtonConfig, RenderedButton, ButtonValidation } from './types';

export class ButtonWriter {
  /**
   * Renderizar botón con o sin SVG
   */
  renderButton(button: ButtonConfig, withSvg?: boolean): string {
    if (withSvg && button.icon) {
      return `[${button.icon} ${button.name}](button://${button.action}${this.encodeParams(button.params)})`;
    }

    return `[${button.name}](button://${button.action}${this.encodeParams(button.params)})`;
  }

  /**
   * Codificar parámetros para URL
   */
  private encodeParams(params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `?${queryString}`;
  }

  /**
   * Insertar botón en contenido en posición específica
   */
  insertButton(
    content: string,
    position: number,
    button: ButtonConfig,
    withSvg?: boolean
  ): string {
    const rendered = this.renderButton(button, withSvg);
    return content.slice(0, position) + rendered + content.slice(position);
  }

  /**
   * Insertar botón al final del archivo
   */
  appendButton(
    content: string,
    button: ButtonConfig,
    withSvg?: boolean
  ): string {
    const rendered = this.renderButton(button, withSvg);
    return content + '\n' + rendered;
  }

  /**
   * Insertarción dentro de estructura ad-flex/ad-blank
   */
  insertIntoAdmonition(
    content: string,
    button: ButtonConfig,
    admonitionId?: string,
    withSvg?: boolean
  ): string {
    const rendered = this.renderButton(button, withSvg);

    // Si no hay ID específico, insertar en el último ad-blank
    if (!admonitionId) {
      const adBlankRegex = /```ad-blank\s*\n([\s\S]*?)\n```/g;
      let lastIndex = -1;
      let match;

      while ((match = adBlankRegex.exec(content)) !== null) {
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex !== -1) {
        // Insertar antes del último ```
        const insertPoint = lastIndex - 3;
        return (
          content.slice(0, insertPoint) +
          rendered +
          '\n' +
          content.slice(insertPoint)
        );
      }
    }

    return content;
  }

  /**
   * Remover botón del contenido por ID
   */
  removeButton(content: string, buttonId: string): string {
    const regex = new RegExp(
      `\\[.*?\\]\\(button://${buttonId}[^)]*\\)\\n?`,
      'g'
    );
    return content.replace(regex, '');
  }

  /**
   * Actualizar parámetros de un botón
   */
  updateButtonParams(
    content: string,
    action: string,
    newParams: Record<string, string>
  ): string {
    const paramsStr = Object.entries(newParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const regex = new RegExp(
      `\\(button://${action}[^)]*\\)`,
      'g'
    );

    return content.replace(regex, `(button://${action}?${paramsStr})`);
  }

  /**
   * Crear botón predefinido de completar
   */
  createCompleteButton(uid: string): ButtonConfig {
    return {
      name: 'Completar',
      action: 'complete',
      uid,
      params: { uid, date: new Date().toISOString().split('T')[0] },
      emoji: '✅',
      color: '#4CAF50',
    };
  }

  /**
   * Crear botón predefinido de editar
   */
  createEditButton(uid: string): ButtonConfig {
    return {
      name: 'Editar',
      action: 'edit',
      uid,
      params: { uid },
      emoji: '✏️',
      color: '#2196F3',
    };
  }

  /**
   * Crear botón predefinido de eliminar
   */
  createDeleteButton(uid: string): ButtonConfig {
    return {
      name: 'Eliminar',
      action: 'delete',
      uid,
      params: { uid },
      emoji: '🗑️',
      color: '#F44336',
    };
  }

  /**
   * Crear botón predefinido de prioridad
   */
  createPriorityButton(uid: string, value: string): ButtonConfig {
    return {
      name: 'Prioridad',
      action: 'priority',
      uid,
      params: { uid, value },
      emoji: '📌',
      color: '#FF9800',
    };
  }

  /**
   * Validar configuración de botón
   */
  validateButton(button: ButtonConfig): ButtonValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Campos requeridos
    if (!button.name || button.name.trim() === '') {
      errors.push('Botón debe tener un nombre');
    }

    if (!button.action || button.action.trim() === '') {
      errors.push('Botón debe tener una acción');
    }

    // Validaciones opcionales
    if (button.color && !/^#[0-9A-Fa-f]{6}$/.test(button.color)) {
      warnings.push('Color no es un hex válido');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Parsear configuración de botón desde string
   */
  parseButtonConfig(configStr: string): ButtonConfig | null {
    // Formato esperado: "name|action|params"
    const parts = configStr.split('|');

    if (parts.length < 2) {
      return null;
    }

    const [name, action, ...paramParts] = parts;

    const params: Record<string, string> = {};
    if (paramParts.length > 0) {
      const paramStr = paramParts.join('|');
      const paramPairs = paramStr.split('&');

      for (const pair of paramPairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key.trim()] = decodeURIComponent(value.trim());
        }
      }
    }

    return {
      name: name.trim(),
      action: action.trim(),
      params,
    };
  }

  /**
   * Detectar referencias a botones en contenido
   */
  detectButtonReferences(content: string): string[] {
    const regex = /`button-([a-z0-9-]+)`/gi;
    const references: Set<string> = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
      references.add(`button-${match[1].toLowerCase()}`);
    }

    return Array.from(references);
  }
}
