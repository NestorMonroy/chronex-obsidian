/**
 * TaskServiceWithVault - Integración Real con Obsidian Vault
 * Crea tareas dentro de objetivos
 */

import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { ObsidianVaultAdapter } from '../adapters/obsidianVaultAdapter';
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
          error: `Validation failed: ${validation.error}`,
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

      // Crear FOLDERNTE
      await FolderNoteService.createFolderNote(folderPath, taskId, {
        type: 'tarea',
        title: input.taskName,
        description: input.description,
        parentId: input.parentObjectiveId,
        dateCreated,
        status: 'pendiente',
        icon: '✅'
      });

      // SINCRONIZAR CON ÍNDICE GLOBAL
      await IndexSyncService.updateIndexEntry('tarea', taskId, {
        title: input.taskName,
        path: folderPath,
        description: input.description,
        status: 'pendiente',
        priority: input.priority || 'MEDIA',
        dateCreated
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
Tarea creada automáticamente con chronex-obsidian plugin.
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

      return tasks.filter(t => t !== null) as any;
    } catch (error) {
      console.error('[TaskService] Error listing tasks:', error);
      return [];
    }
  }

  // ==================== NUEVOS MÉTODOS (SEMANA 1) ====================

  static async getTaskById(taskId: string): Promise<TaskWithVaultResult | null> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const allTasks = await this.listTasksFromVault();
      const task = allTasks.find((t) => t.taskId === taskId);

      if (!task) {
        return null;
      }

      return task;
    } catch (error) {
      console.error('[TaskService] Error getting task by id:', error);
      return null;
    }
  }

  static async updateTaskWithVault(
    taskId: string,
    updates: Partial<TaskWithVaultInput>
  ): Promise<TaskWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. OBTENER TAREA ACTUAL
      const currentTask = await this.getTaskById(taskId);
      if (!currentTask) {
        return {
          success: false,
          error: `Task "${taskId}" not found`,
        };
      }

      // 2. ACTUALIZAR FRONTMATTER
      const updatedFrontmatter = {
        ...currentTask.frontmatter,
        title: updates.taskName || currentTask.frontmatter?.title,
        description: updates.description ?? currentTask.frontmatter?.description,
        priority: updates.priority || currentTask.frontmatter?.priority,
        dueDate: updates.dueDate || currentTask.frontmatter?.dueDate,
      };

      // 3. GENERAR NUEVO CONTENIDO
      const newContent = this.generateTaskContent(updatedFrontmatter);

      // 4. ESCRIBIR ARCHIVO
      await (vault as any).writeFile(currentTask.notePath!, newContent);

      // 5. SINCRONIZAR .index.json
      await IndexSyncService.updateIndexEntry('tarea', taskId, {
        title: updatedFrontmatter.title,
        path: currentTask.folderPath,
        description: updatedFrontmatter.description,
        status: (updatedFrontmatter as any).status || 'pendiente',
        priority: updatedFrontmatter.priority,
      } as any);

      vault.showSuccessNotice(`Tarea "${updatedFrontmatter.title}" actualizada!`);

      return {
        success: true,
        taskId,
        folderPath: currentTask.folderPath,
        notePath: currentTask.notePath,
        frontmatter: updatedFrontmatter,
        message: `Task "${updatedFrontmatter.title}" updated successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error updating task: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static async deleteTaskWithVault(taskId: string): Promise<TaskWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. OBTENER TAREA
      const task = await this.getTaskById(taskId);
      if (!task) {
        return {
          success: false,
          error: `Task "${taskId}" not found`,
        };
      }

      // 2. ELIMINAR CARPETA
      if (task.folderPath) {
        await vault.deleteFolder(task.folderPath);
      }

      // 3. ACTUALIZAR .index.json
      await IndexSyncService.deleteIndexEntry('tarea', taskId);

      vault.showSuccessNotice(`Tarea "${task.frontmatter?.title}" eliminada!`);

      return {
        success: true,
        taskId,
        message: `Task "${task.frontmatter?.title}" deleted successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error deleting task: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  static parseTaskContent(content: string): {
    subtasks: Array<{
      content: string;
      completed: boolean;
      priority?: string;
      hasDates: boolean;
    }>;
  } {
    try {
      const lines = content.split('\n');
      const subtasks: Array<{
        content: string;
        completed: boolean;
        priority?: string;
        hasDates: boolean;
      }> = [];

      lines.forEach((line) => {
        // Detectar línea de checkbox: - [ ] o - [x]
        const checkboxMatch = line.match(/^\s*-\s+\[([ xX])\]\s+(.*)/);
        if (!checkboxMatch) return;

        const completed = /[xX]/.test(checkboxMatch[1]);
        const lineContent = checkboxMatch[2];

        // Extraer prioridad (emojis de gantt-calendar)
        const priorityMap: Record<string, string> = {
          '🔺': 'CRÍTICA',
          '⏫': 'ALTA',
          '🔼': 'MEDIA',
          '🔽': 'BAJA',
          '⏬': 'MUY BAJA',
        };

        let priority: string | undefined;
        for (const [emoji, level] of Object.entries(priorityMap)) {
          if (lineContent.includes(emoji)) {
            priority = level;
            break;
          }
        }

        // Detectar si tiene fechas (patrón YYYY-MM-DD)
        const hasDates = /\d{4}-\d{2}-\d{2}/.test(lineContent);

        subtasks.push({
          content: lineContent.trim(),
          completed,
          priority,
          hasDates,
        });
      });

      return { subtasks };
    } catch (error) {
      console.error('[TaskService] Error parsing task content:', error);
      return { subtasks: [] };
    }
  }

  static calculateProgress(
    content: string
  ): {
    total: number;
    completed: number;
    percentage: number;
  } {
    try {
      const parsed = this.parseTaskContent(content);
      const total = parsed.subtasks.length;
      const completed = parsed.subtasks.filter((s) => s.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, percentage };
    } catch (error) {
      console.error('[TaskService] Error calculating progress:', error);
      return { total: 0, completed: 0, percentage: 0 };
    }
  }
}

export const taskServiceWithVault = {
  create: (input: TaskWithVaultInput) =>
    TaskServiceWithVault.createTaskWithVault(input),
  list: (objectiveId?: string) =>
    TaskServiceWithVault.listTasksFromVault(objectiveId),
  get: (taskId: string) =>
    TaskServiceWithVault.getTaskById(taskId),
  update: (taskId: string, updates: Partial<TaskWithVaultInput>) =>
    TaskServiceWithVault.updateTaskWithVault(taskId, updates),
  delete: (taskId: string) =>
    TaskServiceWithVault.deleteTaskWithVault(taskId),
  parseContent: (content: string) =>
    TaskServiceWithVault.parseTaskContent(content),
  calculateProgress: (content: string) =>
    TaskServiceWithVault.calculateProgress(content),
};
