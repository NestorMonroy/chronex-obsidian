/**
 * FolderAboutService - Crear y gestionar _about_ notes
 * 
 * Lógica PROPIA inspirada en Folder Note pero completamente independiente.
 * Cada carpeta de entidad tiene una nota _about_ que describe su contenido.
 * 
 * Estructura:
 * 200-PROYECTOS/PROJ-ID/_about_.md (descripción de proyecto)
 * 200-PROYECTOS/PROJ-ID/objetivos/_about_.md (descripción de objetivos)
 * 200-PROYECTOS/tareas/_about_.md (descripción de tareas)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';

export interface FolderAboutConfig {
  folderAboutHide: boolean;        // Esconder archivo _about_
  folderAboutName: string;          // Nombre del archivo: "_about_"
  folderAboutAutoGenerate: boolean; // Auto-generar en cada carpeta
  folderAboutTemplate: string;      // Template inicial
}

export interface FolderAboutData {
  type: string;           // proyecto, objetivo, tarea, documento, carpeta
  title: string;          // Nombre de la entidad
  description?: string;   // Descripción
  parentId?: string;      // ID del padre (si aplica)
  dateCreated: string;    // YYYY-MM-DD
  status: string;         // activo, archivado, etc
  icon?: string;          // Emoji o icono
}

export class FolderAboutService {
  private static readonly ABOUT_FILE = '_about_.md';
  private static readonly DEFAULT_ICON: Record<string, string> = {
    proyecto: '📁',
    objetivo: '🎯',
    tarea: '✅',
    documento: '📄',
    carpeta: '📂'
  };

  /**
   * Crear _about_ note para una carpeta
   */
  static async createAboutNote(
    folderPath: string,
    data: FolderAboutData
  ): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const aboutPath = `${folderPath}/${this.ABOUT_FILE}`;
      const content = this.generateAboutContent(data);

      await vault.createFile(aboutPath, content, true);

      console.log(`[FolderAbout] Created: ${aboutPath}`);
    } catch (error) {
      console.warn(`[FolderAbout] Error creating about note:`, error);
      // No es crítico si falla
    }
  }

  /**
   * Generar contenido de _about_ note
   */
  private static generateAboutContent(data: FolderAboutData): string {
    const icon = data.icon || this.DEFAULT_ICON[data.type] || '📁';

    const frontmatter = {
      type: data.type,
      title: data.title,
      description: data.description || '',
      parent: data.parentId || '',
      dateCreated: data.dateCreated,
      status: data.status,
      cssclass: 'folder-about gridlist noyaml wide-page',
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

## Contenido
<!-- La estructura de esta carpeta se muestra automáticamente -->

---
*Nota creada automáticamente por obsidian-repo*
`;
  }

  /**
   * Actualizar _about_ note existente
   */
  static async updateAboutNote(
    folderPath: string,
    data: Partial<FolderAboutData>
  ): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const aboutPath = `${folderPath}/${this.ABOUT_FILE}`;
      const exists = await vault.fileExists(aboutPath);

      if (!exists) {
        return;
      }

      const content = await vault.readFile(aboutPath);
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!frontmatterMatch) {
        return;
      }

      // Parse existing frontmatter
      const existingFrontmatter: Record<string, any> = {};
      frontmatterMatch[1].split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(': ');
        if (key && valueParts.length > 0) {
          existingFrontmatter[key.trim()] = valueParts.join(': ').trim();
        }
      });

      // Merge with new data
      if (data.title) existingFrontmatter.title = data.title;
      if (data.description) existingFrontmatter.description = data.description;
      if (data.status) existingFrontmatter.status = data.status;

      // Regenrate frontmatter
      const newFrontmatterStr = Object.entries(existingFrontmatter)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1] : '';

      const newContent = `---\n${newFrontmatterStr}\n---\n${body}`;
      await vault.updateFile(aboutPath, newContent);

      console.log(`[FolderAbout] Updated: ${aboutPath}`);
    } catch (error) {
      console.warn(`[FolderAbout] Error updating about note:`, error);
    }
  }

  /**
   * Leer _about_ note de una carpeta
   */
  static async readAboutNote(folderPath: string): Promise<string | null> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const aboutPath = `${folderPath}/${this.ABOUT_FILE}`;
      const exists = await vault.fileExists(aboutPath);

      if (!exists) {
        return null;
      }

      return await vault.readFile(aboutPath);
    } catch (error) {
      console.warn(`[FolderAbout] Error reading about note:`, error);
      return null;
    }
  }

  /**
   * Eliminar _about_ note
   */
  static async deleteAboutNote(folderPath: string): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const aboutPath = `${folderPath}/${this.ABOUT_FILE}`;
      await vault.deleteFile(aboutPath);

      console.log(`[FolderAbout] Deleted: ${aboutPath}`);
    } catch (error) {
      console.warn(`[FolderAbout] Error deleting about note:`, error);
    }
  }

  /**
   * Obtener configuración por defecto
   */
  static getDefaultConfig(): FolderAboutConfig {
    return {
      folderAboutHide: true,
      folderAboutName: '_about_',
      folderAboutAutoGenerate: true,
      folderAboutTemplate: `---
type: {type}
title: {title}
cssclass: folder-about gridlist noyaml
---

# {title}

{description}
`
    };
  }

  /**
   * Verificar si carpeta tiene _about_ note
   */
  static async hasFolderAbout(folderPath: string): Promise<boolean> {
    const vault = ObsidianVaultAdapter.getInstance();
    const aboutPath = `${folderPath}/${this.ABOUT_FILE}`;
    return vault.fileExists(aboutPath);
  }
}

export const folderAboutService = {
  create: (path: string, data: FolderAboutData) =>
    FolderAboutService.createAboutNote(path, data),
  update: (path: string, data: Partial<FolderAboutData>) =>
    FolderAboutService.updateAboutNote(path, data),
  read: (path: string) => FolderAboutService.readAboutNote(path),
  delete: (path: string) => FolderAboutService.deleteAboutNote(path),
  has: (path: string) => FolderAboutService.hasFolderAbout(path),
  config: () => FolderAboutService.getDefaultConfig()
};
