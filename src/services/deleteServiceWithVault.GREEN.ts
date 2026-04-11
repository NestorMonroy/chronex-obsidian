/**
 * DeleteServiceWithVault - GREEN Implementation
 * UC-020: Eliminar Entidad (7 tests)
 */

import { ObsidianVaultAdapter } } from './obsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';

export interface DeleteEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;
  permanent: boolean;
}

export interface DeleteEntityOutput {
  success: boolean;
  entityId?: string;
  deleted?: boolean;
  error?: string;
}

export class DeleteServiceWithVault {
  static async deleteEntityWithVault(input: DeleteEntityInput): Promise<DeleteEntityOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.entityId || !input.entityType || !input.folderPath) {
        return { success: false, error: 'Missing required fields' };
      }

      // AUTO-eliminar FolderNote
      await FolderNoteService.deleteFolderNote(input.folderPath, input.entityId);

      // Eliminar carpeta completa
      await vault.deleteFolder(input.folderPath);

      // AUTO-eliminar del .index.json
      await IndexSyncService.deleteIndexEntry(input.entityType, input.entityId);

      return {
        success: true,
        entityId: input.entityId,
        deleted: true
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
