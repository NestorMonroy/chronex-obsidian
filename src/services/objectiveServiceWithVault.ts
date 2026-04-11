/**
 * ObjectiveServiceWithVault - Integración Real con Obsidian Vault
 * Crea objetivos dentro de proyectos existentes
 */

import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface ObjectiveWithVaultInput {
  objectiveName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  parentProjectId?: string;
}

export interface ObjectiveWithVaultResult {
  success: boolean;
  objectiveId?: string;
  folderPath?: string;
  notePath?: string;
  frontmatter?: Record<string, any>;
  message?: string;
  error?: string;
}

export class ObjectiveServiceWithVault {
  private static readonly OBJECTIVE_PREFIX = 'OBJ';
  private static readonly PROJECTS_FOLDER = '200-PROYECTOS';

  static async createObjectiveWithVault(
    input: ObjectiveWithVaultInput
  ): Promise<ObjectiveWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateObjectiveInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. GENERAR ID
      const objectiveId = IdGenerator.generateCustomId(this.OBJECTIVE_PREFIX);

      // 3. DETERMINAR RUTA - dentro de objetivos/ del proyecto
      let folderPath: string;
      if (input.parentProjectId) {
        folderPath = `${this.PROJECTS_FOLDER}/${input.parentProjectId}/objetivos/${objectiveId}`;
      } else {
        folderPath = `${this.PROJECTS_FOLDER}/objetivos/${objectiveId}`;
      }

      await vault.createFolder(folderPath);

      // 4. CREAR README.md
      const dateCreated = new Date().toISOString().split('T')[0];
      const frontmatter = {
        uid: objectiveId,
        type: 'objetivo',
        title: input.objectiveName,
        description: input.description || '',
        priority: input.priority || 'MEDIA',
        dateCreated,
        status: 'activo',
      };

      const content = this.generateObjectiveContent(frontmatter);
      const notePath = `${folderPath}/README.md`;

      await vault.createFile(notePath, content);

      // 5. CREAR FOLDERNTE
      await FolderNoteService.createFolderNote(folderPath, {
        type: 'objetivo',
        title: input.objectiveName,
        description: input.description,
        parentId: input.parentProjectId,
        dateCreated,
        status: 'activo',
        icon: '🎯'
      });

      // 5B. SINCRONIZAR CON ÍNDICE GLOBAL
      await IndexSyncService.updateIndexEntry('objetivo', objectiveId, {
        title: input.objectiveName,
        path: folderPath,
        description: input.description,
        status: 'activo',
        priority: input.priority || 'MEDIA',
        dateCreated
      });

      vault.showSuccessNotice(`Objetivo "${input.objectiveName}" creado!`);

      return {
        success: true,
        objectiveId,
        folderPath,
        notePath,
        frontmatter,
        message: `Objective "${input.objectiveName}" created successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error creating objective: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private static generateObjectiveContent(
    frontmatter: Record<string, any>
  ): string {
    const frontmatterString = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `---
${frontmatterString}
---

# ${frontmatter.title}

## Descripción
${frontmatter.description || 'Sin descripción'}

## Información
- **UID**: ${frontmatter.uid}
- **Prioridad**: ${frontmatter.priority}
- **Creado**: ${frontmatter.dateCreated}
- **Estado**: ${frontmatter.status}

## Tareas
<!-- Crear tareas con UC-012 -->

## Checklist
- [ ] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3

## Notas
Objetivo creado automáticamente con obsidian-repo plugin.
`;
  }

  static async listObjectivesFromVault(
    parentProjectId?: string
  ): Promise<ObjectiveWithVaultResult[]> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      let folderPath: string;
      if (parentProjectId) {
        folderPath = `${this.PROJECTS_FOLDER}/${parentProjectId}/objetivos`;
      } else {
        folderPath = `${this.PROJECTS_FOLDER}/objetivos`;
      }

      const folders = await vault.getFolders(folderPath);

      const objectives = await Promise.all(
        folders.map(async (folder) => {
          try {
            const files = await vault.getFiles(folder.path);
            const readmeFile = files.find((f) => f.name === 'README.md');

            if (!readmeFile) return null;

            const content = await vault.readFile(readmeFile.path);
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (!frontmatterMatch) return null;

            const frontmatter: Record<string, any> = {};
            frontmatterMatch[1].split('\n').forEach((line) => {
              const [key, ...valueParts] = line.split(': ');
              if (key && valueParts.length > 0) {
                frontmatter[key.trim()] = valueParts.join(': ').trim();
              }
            });

            return {
              success: true,
              objectiveId: frontmatter.uid,
              folderPath: folder.path,
              notePath: readmeFile.path,
              frontmatter,
            };
          } catch (error) {
            return null;
          }
        })
      );

      return objectives.filter((o): o is ObjectiveWithVaultResult => o !== null);
    } catch (error) {
      console.error('[ObjectiveService] Error listing objectives:', error);
      return [];
    }
  }
}

export const objectiveServiceWithVault = {
  create: (input: ObjectiveWithVaultInput) =>
    ObjectiveServiceWithVault.createObjectiveWithVault(input),
  list: (projectId?: string) =>
    ObjectiveServiceWithVault.listObjectivesFromVault(projectId),
};
