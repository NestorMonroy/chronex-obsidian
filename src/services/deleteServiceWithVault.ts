/**
 * DeleteServiceWithVault - Eliminación con Auto-Delete FolderNote + IndexSync
 * 
 * Cuando borras una entidad:
 * 1. Carpeta se elimina
 * 2. FolderNote se auto-elimina (deleteFolderNote)
 * 3. .index.json se auto-actualiza (deleteIndexEntry)
 * 
 * TODO AUTOMÁTICO. SINCRONIZACIÓN PERFECTA.
 */

import { ObsidianVaultAdapter } from '../adapters/obsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { Validator } from '../utils/validators';

export interface DeleteEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;
  permanent?: boolean; // true = borrar todo, false = mover a trash
}

export interface DeleteEntityResult {
  success: boolean;
  entityId?: string;
  message?: string;
  error?: string;
}

export class DeleteServiceWithVault {
  /**
   * Eliminar entidad con auto-cleanup completo
   */
  static async deleteEntityWithVault(
    input: DeleteEntityInput
  ): Promise<DeleteEntityResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateDeleteInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.error?.join(', ')}`,
        };
      }

      // 2. AUTO-DELETE: Eliminar FolderNote
      await FolderNoteService.deleteFolderNote(input.folderPath, input.entityId);

      // 3. ELIMINAR CARPETA COMPLETA
      const folderExists = await vault.folderExists(input.folderPath);
      if (folderExists) {
        await vault.deleteFolder(input.folderPath);
      }

      // 4. AUTO-SYNC: Eliminar del índice global
      await IndexSyncService.deleteIndexEntry(
        input.entityType,
        input.entityId
      );

      vault.showSuccessNotice(
        `${input.entityType} "${input.entityId}" eliminado!`
      );

      console.log(`[DeleteService] Entity deleted:`, {
        entityId: input.entityId,
        entityType: input.entityType,
        folderPath: input.folderPath,
      });

      return {
        success: true,
        entityId: input.entityId,
        message: `${input.entityType} deleted successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error deleting entity: ${errorMessage}`);

      console.error('[DeleteService] Error:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
