/**
 * EditServiceWithVault - Edición con Auto-Rename FolderNote + IndexSync
 * 
 * Cuando editas una entidad:
 * 1. README.md se actualiza
 * 2. FolderNote se auto-renombra (updateFolderNoteOnMetadataChange)
 * 3. .index.json se auto-sincroniza (updateIndexEntry)
 * 
 * TODO AUTOMÁTICO. CERO PASOS MANUALES.
 */

import { ObsidianVaultAdapter } from '../adapters/obsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface EditEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    [key: string]: any;
  };
  folderPath: string;
}

export interface EditEntityResult {
  success: boolean;
  entityId?: string;
  message?: string;
  error?: string;
}

export class EditServiceWithVault {
  /**
   * Editar entidad con auto-sync completo
   */
  static async editEntityWithVault(
    input: EditEntityInput
  ): Promise<EditEntityResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateEditInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. LEER README.md ACTUAL
      const readmePath = `${input.folderPath}/README.md`;
      const oldContent = await vault.readFile(readmePath);
      const oldData = this.parseFrontmatter(oldContent);

      // 3. ACTUALIZAR README.md
      const newContent = this.mergeContent(oldContent, input.updates);
      await vault.updateFile(readmePath, newContent);

      // 4. AUTO-RENAME: Actualizar FolderNote
      const newData = { ...oldData, ...input.updates };
      await FolderNoteService.updateFolderNoteOnMetadataChange(
        input.folderPath,
        oldData,
        newData
      );

      // 5. AUTO-SYNC: Actualizar índice global
      await IndexSyncService.updateIndexEntry(
        input.entityType,
        input.entityId,
        {
          title: input.updates.title || oldData.title,
          description: input.updates.description || oldData.description,
          status: input.updates.status || oldData.status,
          priority: input.updates.priority || oldData.priority,
          path: input.folderPath
        }
      );

      vault.showSuccessNotice(
        `${input.entityType} "${input.updates.title || oldData.title}" actualizado!`
      );

      console.log(`[EditService] Entity updated:`, {
        entityId: input.entityId,
        entityType: input.entityType,
        updates: input.updates,
      });

      return {
        success: true,
        entityId: input.entityId,
        message: `${input.entityType} updated successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error updating entity: ${errorMessage}`);

      console.error('[EditService] Error:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Parsear frontmatter de contenido
   */
  private static parseFrontmatter(content: string): Record<string, any> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const data: Record<string, any> = {};
    match[1].split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        data[key.trim()] = valueParts.join(': ').trim();
      }
    });

    return data;
  }

  /**
   * Fusionar contenido con actualizaciones
   */
  private static mergeContent(
    oldContent: string,
    updates: Record<string, any>
  ): string {
    const match = oldContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return oldContent;

    const frontmatterLines = match[1].split('\n');
    const body = match[2];

    // Actualizar frontmatter
    const newFrontmatter = frontmatterLines
      .map((line) => {
        const [key] = line.split(': ');
        if (key && updates[key.trim()]) {
          return `${key}: ${updates[key.trim()]}`;
        }
        return line;
      })
      .join('\n');

    return `---\n${newFrontmatter}\n---\n${body}`;
  }
}
