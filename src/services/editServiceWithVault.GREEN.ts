/**
 * EditServiceWithVault - GREEN Implementation
 * UC-019: Editar Entidad (7 tests)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';

export interface EditEntityInput {
  entityId: string;
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
  folderPath: string;
}

export interface EditEntityOutput {
  success: boolean;
  entityId?: string;
  updated?: any;
  error?: string;
}

export class EditServiceWithVault {
  static async editEntityWithVault(input: EditEntityInput): Promise<EditEntityOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.entityId || !input.entityType || !input.folderPath || !input.updates) {
        return { success: false, error: 'Missing required fields' };
      }

      // Leer README.md actual
      const readmeContent = await vault.readFile(`${input.folderPath}/README.md`);

      // Actualizar README.md con nuevos valores
      const updatedReadmeContent = this.updateReadmeContent(readmeContent, input.updates);
      await vault.updateFile(`${input.folderPath}/README.md`, updatedReadmeContent);

      // AUTO-actualizar FolderNote
      const folderNotePath = `${input.folderPath}/${input.entityId}.md`;
      await FolderNoteService.updateFolderNoteOnMetadataChange(
        input.folderPath,
        input.entityId,
        {}, // old data (no importa)
        input.updates // new data
      );

      // AUTO-sincronizar .index.json
      const timestamp = new Date().toISOString();
      await IndexSyncService.updateIndexEntry(input.entityType, input.entityId, {
        ...input.updates,
        lastModified: timestamp
      });

      return {
        success: true,
        entityId: input.entityId,
        updated: input.updates
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private static updateReadmeContent(content: string, updates: any): string {
    let updated = content;

    if (updates.title) {
      updated = updated.replace(/^title: .+$/m, `title: ${updates.title}`);
    }
    if (updates.description) {
      updated = updated.replace(/^description: .+$/m, `description: ${updates.description}`);
    }
    if (updates.status) {
      updated = updated.replace(/^status: .+$/m, `status: ${updates.status}`);
    }
    if (updates.priority) {
      updated = updated.replace(/^priority: .+$/m, `priority: ${updates.priority}`);
    }

    return updated;
  }
}
