/**
 * FolderNoteService - Sistema profesional de carpeta + nota
 * 
 * LÓGICA DE FOLDER NOTE (NUESTRO PROPIO SISTEMA):
 * 
 * - folderNoteName: CONFIGURABLE (no hardcodeado)
 * - folderNoteHide: Ocultar archivo del árbol
 * - folderNoteAutoRename: Actualizar automáticamente cuando metadatos cambian
 * - folderDelete2Note: Eliminar nota cuando carpeta se borra
 * 
 * DIFERENCIA con _about_:
 * - FLEXIBLE: nombre variable según config
 * - INTELIGENTE: auto-rename en metadatos
 * - OCULTO: no contamina árbol de archivos
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';

export interface FolderNoteConfig {
  folderNoteName: string;           // Nombre del archivo: "_index_", "_meta_", "_info_", etc
  folderNoteHide: boolean;          // Ocultar del árbol de archivos
  folderNoteAutoRename: boolean;    // Auto-actualizar cuando metadatos cambian
  folderDelete2Note: boolean;       // Eliminar nota cuando carpeta se borra
  folderNoteType: 'inside' | 'outside';  // inside = dentro de carpeta, outside = fuera
  folderNoteStrInit: string;        // Template inicial
}

export interface FolderNoteData {
  type: string;           // 'proyecto', 'objetivo', 'tarea', 'documento', 'carpeta'
  title: string;
  description?: string;
  parentId?: string;
  dateCreated: string;
  status: string;
  icon?: string;
  // Auto-rename fields
  lastModified?: string;
  autoRenameVersion?: number;
}

export class FolderNoteService {
  private static config: FolderNoteConfig = FolderNoteService.getDefaultConfig();

  /**
   * Inicializar configuración
   */
  static initialize(config: Partial<FolderNoteConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[FolderNote] Initialized with config:', this.config);
  }

  /**
   * Crear folder note
   */
  static async createFolderNote(
    folderPath: string,
    data: FolderNoteData
  ): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const notePath = `${folderPath}/${this.config.folderNoteName}`;
      const content = this.generateFolderNoteContent(data);

      await vault.createFile(notePath, content, true);

      console.log(`[FolderNote] Created: ${notePath}`);
    } catch (error) {
      console.warn(`[FolderNote] Error creating note:`, error);
    }
  }

  /**
   * AUTO-RENAME: Actualizar folder note cuando metadatos cambian
   */
  static async updateFolderNoteOnMetadataChange(
    folderPath: string,
    oldData: FolderNoteData,
    newData: FolderNoteData
  ): Promise<void> {
    if (!this.config.folderNoteAutoRename) {
      return;
    }

    try {
      const notePath = `${folderPath}/${this.config.folderNoteName}`;
      const exists = await vault.fileExists(notePath);

      if (!exists) {
        return;
      }

      // Detectar cambios relevantes
      const changed = {
        title: oldData.title !== newData.title,
        description: oldData.description !== newData.description,
        status: oldData.status !== newData.status
      };

      if (Object.values(changed).some(c => c)) {
        const content = this.generateFolderNoteContent(newData);
        await vault.updateFile(notePath, content);

        console.log(`[FolderNote] Auto-updated: ${notePath}`, changed);
      }
    } catch (error) {
      console.warn(`[FolderNote] Error on auto-rename:`, error);
    }
  }

  /**
   * AUTO-DELETE: Eliminar folder note cuando carpeta se borra
   */
  static async deleteFolderNote(folderPath: string): Promise<void> {
    if (!this.config.folderDelete2Note) {
      return;
    }

    try {
      const notePath = `${folderPath}/${this.config.folderNoteName}`;
      await vault.deleteFile(notePath);

      console.log(`[FolderNote] Deleted: ${notePath}`);
    } catch (error) {
      console.warn(`[FolderNote] Error deleting note:`, error);
    }
  }

  /**
   * Verificar si existe folder note
   */
  static async hasFolderNote(folderPath: string): Promise<boolean> {
    const vault = ObsidianVaultAdapter.getInstance();
    const notePath = `${folderPath}/${this.config.folderNoteName}`;
    return vault.fileExists(notePath);
  }

  /**
   * Leer folder note
   */
  static async readFolderNote(folderPath: string): Promise<string | null> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const notePath = `${folderPath}/${this.config.folderNoteName}`;
      const exists = await vault.fileExists(notePath);

      if (!exists) {
        return null;
      }

      return await vault.readFile(notePath);
    } catch (error) {
      console.warn(`[FolderNote] Error reading note:`, error);
      return null;
    }
  }

  /**
   * Generar contenido de folder note
   */
  private static generateFolderNoteContent(data: FolderNoteData): string {
    const icon = data.icon || this.getIconForType(data.type);
    const timestamp = new Date().toISOString();

    const frontmatter = {
      type: data.type,
      title: data.title,
      description: data.description || '',
      parent: data.parentId || '',
      dateCreated: data.dateCreated,
      lastModified: timestamp,
      status: data.status,
      cssclass: 'folder-note gridlist noyaml wide-page',
      obsidianUIMode: 'preview'
    };

    const frontmatterStr = Object.entries(frontmatter)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    return `---
${frontmatterStr}
---

${icon} # ${data.title}

## Descripción
${data.description || 'Sin descripción'}

## Información
- **Tipo**: ${data.type}
- **Estado**: ${data.status}
- **Creado**: ${data.dateCreated}
- **Actualizado**: ${timestamp}

## Contenido
<!-- Contenido automático -->

---
*Generado por obsidian-repo plugin*
`;
  }

  /**
   * Obtener icono por tipo
   */
  private static getIconForType(type: string): string {
    const icons: Record<string, string> = {
      proyecto: '📁',
      objetivo: '🎯',
      tarea: '✅',
      documento: '📄',
      carpeta: '📂'
    };
    return icons[type] || '📄';
  }

  /**
   * Obtener configuración por defecto
   */
  static getDefaultConfig(): FolderNoteConfig {
    return {
      folderNoteName: '_index_',        // Configurable, no hardcodeado
      folderNoteHide: true,
      folderNoteAutoRename: true,
      folderDelete2Note: true,
      folderNoteType: 'inside',
      folderNoteStrInit: `---
type: {type}
title: {title}
cssclass: folder-note gridlist
obsidianUIMode: preview
---

# {title}

{description}
`
    };
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): FolderNoteConfig {
    return this.config;
  }
}

const vault = ObsidianVaultAdapter.getInstance();
