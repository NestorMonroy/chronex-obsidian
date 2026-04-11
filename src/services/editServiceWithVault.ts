/**
 * EditServiceWithVault - Editar entidades en el vault
 * UC-019: Editar propiedades de proyectos, objetivos, tareas
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';

export interface EditEntityWithVaultInput {
  entityPath: string; // Ruta completa al archivo README.md
  updates: Record<string, any>;
}

export interface EditEntityWithVaultResult {
  success: boolean;
  entityPath?: string;
  updated?: string[];
  message?: string;
  error?: string;
}

export class EditServiceWithVault {
  static async editEntityWithVault(
    input: EditEntityWithVaultInput
  ): Promise<EditEntityWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      if (!input.updates || Object.keys(input.updates).length === 0) {
        return {
          success: false,
          error: 'updates cannot be empty',
        };
      }

      // 2. LEER ARCHIVO ACTUAL
      const content = await vault.readFile(input.entityPath);

      // 3. ACTUALIZAR FRONTMATTER
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch) {
        return {
          success: false,
          error: `Invalid frontmatter in file: ${input.entityPath}`,
        };
      }

      const [, existingFrontmatter, bodyContent] = frontmatterMatch;
      const frontmatterLines = existingFrontmatter.split('\n');
      const existingData: Record<string, number> = {};

      // Parse existing frontmatter
      frontmatterLines.forEach((line, index) => {
        const [key] = line.split(': ');
        if (key) {
          existingData[key.trim()] = index;
        }
      });

      // Update with new values
      const updated: string[] = [];
      for (const [key, value] of Object.entries(input.updates)) {
        if (existingData.hasOwnProperty(key)) {
          frontmatterLines[existingData[key]] = `${key}: ${value}`;
        } else {
          frontmatterLines.push(`${key}: ${value}`);
        }
        updated.push(key);
      }

      // 4. GUARDAR CAMBIOS
      const newFrontmatter = frontmatterLines.join('\n');
      const newContent = `---\n${newFrontmatter}\n---\n${bodyContent}`;

      await vault.updateFile(input.entityPath, newContent);

      vault.showSuccessNotice(`Entidad actualizada (${updated.length} campos)`);

      return {
        success: true,
        entityPath: input.entityPath,
        updated,
        message: `Updated ${updated.length} fields`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error editing entity: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static async updateStatus(
    entityPath: string,
    newStatus: string
  ): Promise<EditEntityWithVaultResult> {
    return this.editEntityWithVault({
      entityPath,
      updates: { status: newStatus },
    });
  }
}

export const editServiceWithVault = {
  edit: (input: EditEntityWithVaultInput) =>
    EditServiceWithVault.editEntityWithVault(input),
  updateStatus: (path: string, status: string) =>
    EditServiceWithVault.updateStatus(path, status),
};
