/**
 * DeleteServiceWithVault - Eliminar entidades del vault
 * UC-020: Eliminar proyectos, objetivos, tareas, documentos
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';

export interface DeleteEntityWithVaultResult {
  success: boolean;
  entityPath?: string;
  message?: string;
  error?: string;
}

export class DeleteServiceWithVault {
  static async deleteEntityWithVault(
    entityFolderPath: string
  ): Promise<DeleteEntityWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR QUE EXISTE
      const folderExists = await vault.folderExists(entityFolderPath);
      if (!folderExists) {
        return {
          success: false,
          error: `Folder not found: ${entityFolderPath}`,
        };
      }

      // 2. ELIMINAR CARPETA RECURSIVAMENTE
      await vault.deleteFolder(entityFolderPath);

      vault.showSuccessNotice(`Entidad eliminada: ${entityFolderPath}`);

      return {
        success: true,
        entityPath: entityFolderPath,
        message: `Entity deleted: ${entityFolderPath}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error deleting entity: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static async deleteProject(projectFolderPath: string): Promise<DeleteEntityWithVaultResult> {
    return this.deleteEntityWithVault(projectFolderPath);
  }

  static async deleteObjective(
    objectiveFolderPath: string
  ): Promise<DeleteEntityWithVaultResult> {
    return this.deleteEntityWithVault(objectiveFolderPath);
  }

  static async deleteTask(taskFolderPath: string): Promise<DeleteEntityWithVaultResult> {
    return this.deleteEntityWithVault(taskFolderPath);
  }

  static async deleteDocument(
    documentFolderPath: string
  ): Promise<DeleteEntityWithVaultResult> {
    return this.deleteEntityWithVault(documentFolderPath);
  }
}

export const deleteServiceWithVault = {
  delete: (path: string) => DeleteServiceWithVault.deleteEntityWithVault(path),
  project: (path: string) => DeleteServiceWithVault.deleteProject(path),
  objective: (path: string) => DeleteServiceWithVault.deleteObjective(path),
  task: (path: string) => DeleteServiceWithVault.deleteTask(path),
  document: (path: string) => DeleteServiceWithVault.deleteDocument(path),
};
