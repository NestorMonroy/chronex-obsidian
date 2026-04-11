/**
 * ArchiveServiceWithVault - Archivar/Desarchivar entidades
 * UC-021: Archivar proyectos, objetivos, tareas
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';

export interface ArchiveEntityWithVaultResult {
  success: boolean;
  entityPath?: string;
  status?: string;
  archivedDate?: string;
  message?: string;
  error?: string;
}

export class ArchiveServiceWithVault {
  static async archiveEntityWithVault(
    entityFilePath: string
  ): Promise<ArchiveEntityWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. LEER ARCHIVO
      const content = await vault.readFile(entityFilePath);

      // 2. ACTUALIZAR FRONTMATTER
      const archivedDate = new Date().toISOString().split('T')[0];
      const updates = {
        status: 'archivado',
        archivedDate,
      };

      await vault.updateFrontmatter(entityFilePath, updates);

      vault.showSuccessNotice(`Entidad archivada`);

      return {
        success: true,
        entityPath: entityFilePath,
        status: 'archivado',
        archivedDate,
        message: `Entity archived successfully`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error archiving entity: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static async unarchiveEntityWithVault(
    entityFilePath: string,
    restoreStatus: string = 'activo'
  ): Promise<ArchiveEntityWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const updates = {
        status: restoreStatus,
      };

      await vault.updateFrontmatter(entityFilePath, updates);

      vault.showSuccessNotice(`Entidad desarchivada`);

      return {
        success: true,
        entityPath: entityFilePath,
        status: restoreStatus,
        message: `Entity unarchived successfully`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error unarchiving entity: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static async archiveProject(projectFilePath: string): Promise<ArchiveEntityWithVaultResult> {
    return this.archiveEntityWithVault(projectFilePath);
  }

  static async unarchiveProject(projectFilePath: string): Promise<ArchiveEntityWithVaultResult> {
    return this.unarchiveEntityWithVault(projectFilePath, 'activo');
  }

  static async archiveObjective(objectiveFilePath: string): Promise<ArchiveEntityWithVaultResult> {
    return this.archiveEntityWithVault(objectiveFilePath);
  }

  static async unarchiveObjective(
    objectiveFilePath: string
  ): Promise<ArchiveEntityWithVaultResult> {
    return this.unarchiveEntityWithVault(objectiveFilePath, 'activo');
  }

  static async archiveTask(taskFilePath: string): Promise<ArchiveEntityWithVaultResult> {
    return this.archiveEntityWithVault(taskFilePath);
  }

  static async unarchiveTask(taskFilePath: string): Promise<ArchiveEntityWithVaultResult> {
    return this.unarchiveEntityWithVault(taskFilePath, 'pendiente');
  }
}

export const archiveServiceWithVault = {
  archive: (path: string) => ArchiveServiceWithVault.archiveEntityWithVault(path),
  unarchive: (path: string, status?: string) =>
    ArchiveServiceWithVault.unarchiveEntityWithVault(path, status),
  archiveProject: (path: string) => ArchiveServiceWithVault.archiveProject(path),
  unarchiveProject: (path: string) => ArchiveServiceWithVault.unarchiveProject(path),
  archiveObjective: (path: string) => ArchiveServiceWithVault.archiveObjective(path),
  unarchiveObjective: (path: string) => ArchiveServiceWithVault.unarchiveObjective(path),
  archiveTask: (path: string) => ArchiveServiceWithVault.archiveTask(path),
  unarchiveTask: (path: string) => ArchiveServiceWithVault.unarchiveTask(path),
};
