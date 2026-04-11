/**
 * TaskServiceWithVault - Integración Real con Obsidian Vault
 * Crea tareas dentro de objetivos
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface TaskWithVaultInput {
  taskName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  dueDate?: string;
  parentObjectiveId?: string;
}

export interface TaskWithVaultResult {
  success: boolean;
  taskId?: string;
  folderPath?: string;
  notePath?: string;
  frontmatter?: Record<string, any>;
  message?: string;
  error?: string;
}

export class TaskServiceWithVault {
  private static readonly TASK_PREFIX = 'TSK';
  private static readonly PROJECTS_FOLDER = '200-PROYECTOS';

  static async createTaskWithVault(
    input: TaskWithVaultInput
  ): Promise<TaskWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateTaskInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. GENERAR ID
      const taskId = IdGenerator.generateCustomId(this.TASK_PREFIX);

      // 3. DETERMINAR RUTA
      let folderPath: string;
      if (input.parentObjectiveId) {
        folderPath = `${this.PROJECTS_FOLDER}/tareas/${input.parentObjectiveId}/${taskId}`;
      } else {
        folderPath = `${this.PROJECTS_FOLDER}/tareas/${taskId}`;
      }

      await vault.createFolder(folderPath);

      // 4. CREAR README.md
      const dateCreated = new Date().toISOString().split('T')[0];
      const frontmatter = {
        uid: taskId,
        type: 'tarea',
        title: input.taskName,
        description: input.description || '',
        priority: input.priority || 'MEDIA',
        dueDate: input.dueDate || '',
        dateCreated,
        status: 'pendiente',
      };

      const content = this.generateTaskContent(frontmatter);
      const notePath = `${folderPath}/README.md`;

      await vault.createFile(notePath, content);

      // Crear _about_.md
      await FolderNoteService.createAboutNote(folderPath, {
        type: 'tarea',
        title: input.taskName,
        description: input.description,
        parentObjectiveId: input.parentObjectiveId,
        dateCreated,
        status: 'pendiente',
        icon: 'TSK'
      });

      vault.showSuccessNotice(`Tarea "${input.taskName}" creada!`);

      return {
        success: true,
        taskId,
        folderPath,
        notePath,
        frontmatter,
        message: `Task "${input.taskName}" created successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error creating task: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private static generateTaskContent(
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
- **Vencimiento**: ${frontmatter.dueDate || 'Sin fecha'}
- **Creado**: ${frontmatter.dateCreated}
- **Estado**: ${frontmatter.status}

## Checklist
- [ ] Paso 1
- [ ] Paso 2
- [ ] Paso 3
- [ ] Completar

## Notas
Tarea creada automáticamente con obsidian-repo plugin.
`;
  }

  static async listTasksFromVault(
    parentObjectiveId?: string
  ): Promise<TaskWithVaultResult[]> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      let folderPath: string;
      if (parentObjectiveId) {
        folderPath = `${this.PROJECTS_FOLDER}/tareas/${parentObjectiveId}`;
      } else {
        folderPath = `${this.PROJECTS_FOLDER}/tareas`;
      }

      const folders = await vault.getFolders(folderPath);

      const tasks = await Promise.all(
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
              taskId: frontmatter.uid,
              folderPath: folder.path,
              notePath: readmeFile.path,
              frontmatter,
            };
          } catch (error) {
            return null;
          }
        })
      );

      return tasks.filter((t): t is TaskWithVaultResult => t !== null);
    } catch (error) {
      console.error('[TaskService] Error listing tasks:', error);
      return [];
    }
  }
}

export const taskServiceWithVault = {
  create: (input: TaskWithVaultInput) =>
    TaskServiceWithVault.createTaskWithVault(input),
  list: (objectiveId?: string) =>
    TaskServiceWithVault.listTasksFromVault(objectiveId),
};
