/**
 * FolderNoteService - Sistema profesional de carpeta + nota
 * 
 * El nombre del archivo folderNote es el ID de la entidad:
 * - PROJ-202604-ABC.md para proyectos
 * - OBJ-202604-XYZ.md para objetivos
 * - TSK-202604-LMN.md para tareas
 * - DOC-202604-RST.md para documentos
 * 
 * VENTAJAS:
 * - Único e identificable
 * - Fácil de buscar y rastrear
 * - Cada entidad tiene su propio "espejo"
 * - Sin conflictos de nombres
 */

import { ObsidianVaultAdapter } } from './obsidianVaultAdapter';

export interface FolderNoteConfig {
  folderNoteHide: boolean;
  folderNoteAutoRename: boolean;
  folderDelete2Note: boolean;
  folderNoteType: 'inside' | 'outside';
}

export interface FolderNoteData {
  type: string;
  title: string;
  description?: string;
  parentId?: string;
  dateCreated: string;
  status: string;
  icon?: string;
  lastModified?: string;
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
   * Crear folder note con nombre = ID
   */
  static async createFolderNote(
    folderPath: string,
    entityId: string,
    data: FolderNoteData
  ): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const notePath = `${folderPath}/${entityId}.md`;
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
    entityId: string,
    oldData: FolderNoteData,
    newData: FolderNoteData
  ): Promise<void> {
    if (!this.config.folderNoteAutoRename) {
      return;
    }

    try {
      const notePath = `${folderPath}/${entityId}.md`;
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
  static async deleteFolderNote(
    folderPath: string,
    entityId: string
  ): Promise<void> {
    if (!this.config.folderDelete2Note) {
      return;
    }

    try {
      const notePath = `${folderPath}/${entityId}.md`;
      await vault.deleteFile(notePath);

      console.log(`[FolderNote] Deleted: ${notePath}`);
    } catch (error) {
      console.warn(`[FolderNote] Error deleting note:`, error);
    }
  }

  /**
   * Verificar si existe folder note
   */
  static async hasFolderNote(
    folderPath: string,
    entityId: string
  ): Promise<boolean> {
    const vault = ObsidianVaultAdapter.getInstance();
    const notePath = `${folderPath}/${entityId}.md`;
    return vault.fileExists(notePath);
  }

  /**
   * Leer folder note
   */
  static async readFolderNote(
    folderPath: string,
    entityId: string
  ): Promise<string | null> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const notePath = `${folderPath}/${entityId}.md`;
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
*Espejo generado por obsidian-repo*
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
      folderNoteHide: false,
      folderNoteAutoRename: true,
      folderDelete2Note: true,
      folderNoteType: 'inside'
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
