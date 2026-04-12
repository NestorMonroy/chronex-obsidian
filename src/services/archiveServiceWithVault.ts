/**
 * ArchiveServiceWithVault - Archivación con Auto-Update FolderNote + IndexSync
 * 
 * Cuando archivas una entidad:
 * 1. README.md cambia status a 'archivado'
 * 2. FolderNote se auto-actualiza (status: archivado)
 * 3. .index.json se auto-sincroniza
 * 
 * TODO AUTOMÁTICO. SINCRONIZACIÓN PERFECTA.
 */

import { ObsidianVaultAdapter } from '../adapters/obsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { Validator } from '../utils/validators';

export interface ArchiveEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;
  archive: boolean; // true = archivar, false = desarchivar
}

export interface ArchiveEntityResult {
  success: boolean;
  entityId?: string;
  message?: string;
  error?: string;
}

export class ArchiveServiceWithVault {
  /**
   * Archivar/Desarchivar entidad con auto-update completo
   */
  static async archiveEntityWithVault(
    input: ArchiveEntityInput
  ): Promise<ArchiveEntityResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateArchiveInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. LEER README.md ACTUAL
      const readmePath = `${input.folderPath}/README.md`;
      const oldContent = await vault.readFile(readmePath);

      // 3. ACTUALIZAR STATUS EN README.md
      const newStatus = input.archive ? 'archivado' : 'activo';
      const newContent = oldContent.replace(
        /status: (.*)/g,
        `status: ${newStatus}`
      );
      await vault.updateFile(readmePath, newContent);

      // 4. AUTO-UPDATE: Actualizar FolderNote
      await FolderNoteService.updateFolderNoteOnMetadataChange(
        input.folderPath,
        { status: input.archive ? 'activo' : 'archivado' },
        { status: newStatus }
      );

      // 5. AUTO-SYNC: Actualizar índice global
      await IndexSyncService.updateIndexEntry(
        input.entityType,
        input.entityId,
        {
          status: newStatus,
          path: input.folderPath
        }
      );

      vault.showSuccessNotice(
        `${input.entityType} "${input.entityId}" ${newStatus}!`
      );

      console.log(`[ArchiveService] Entity archived:`, {
        entityId: input.entityId,
        entityType: input.entityType,
        newStatus,
      });

      return {
        success: true,
        entityId: input.entityId,
        message: `${input.entityType} ${newStatus} successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error archiving entity: ${errorMessage}`);

      console.error('[ArchiveService] Error:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
