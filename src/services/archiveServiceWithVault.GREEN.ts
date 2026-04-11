/**
 * ArchiveServiceWithVault - GREEN Implementation
 * UC-021: Archivar Entidad (9 tests)
 */

import { ObsidianVaultAdapter } } from './obsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';

export interface ArchiveEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;
  archive: boolean; // true = archivar, false = restaurar
}

export interface ArchiveEntityOutput {
  success: boolean;
  entityId?: string;
  newStatus?: string;
  error?: string;
}

export class ArchiveServiceWithVault {
  static async archiveEntityWithVault(input: ArchiveEntityInput): Promise<ArchiveEntityOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.entityId || !input.entityType || !input.folderPath || input.archive === undefined) {
        return { success: false, error: 'Missing required fields' };
      }

      // Determinar nuevo status
      const newStatus = input.archive ? 'archivado' : 'activo';

      // Leer README.md
      const readmeContent = await vault.readFile(`${input.folderPath}/README.md`);

      // Cambiar status en README.md
      const updatedReadmeContent = readmeContent.replace(
        /^status: .+$/m,
        `status: ${newStatus}`
      );
      await vault.updateFile(`${input.folderPath}/README.md`, updatedReadmeContent);

      // AUTO-actualizar FolderNote
      await FolderNoteService.updateFolderNoteOnMetadataChange(
        input.folderPath,
        input.entityId,
        { status: input.archive ? 'activo' : 'archivado' },
        { status: newStatus }
      );

      // AUTO-sincronizar .index.json
      const timestamp = new Date().toISOString();
      await IndexSyncService.updateIndexEntry(input.entityType, input.entityId, {
        status: newStatus,
        lastModified: timestamp
      });

      return {
        success: true,
        entityId: input.entityId,
        newStatus: newStatus
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
