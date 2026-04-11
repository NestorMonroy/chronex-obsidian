/**
 * TaskServiceWithVault - GREEN Implementation
 * UC-012: Crear Tarea (8 tests)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { IdGenerator } from '../utils/generateUniqueId';

export interface CreateTaskInput {
  taskName: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  parentObjectiveId: string;
}

export interface CreateTaskOutput {
  success: boolean;
  taskId?: string;
  filesCreated?: string[];
  error?: string;
}

export class TaskServiceWithVault {
  static async createTaskWithVault(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.taskName || !input.description || !input.dueDate || !input.parentObjectiveId) {
        return { success: false, error: 'Missing required fields' };
      }

      // Validar formato de fecha
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(input.dueDate)) {
        return { success: false, error: 'Invalid dueDate format (must be YYYY-MM-DD)' };
      }

      // Generar ID: TSK-YYYYMM-XXXXX
      const taskId = await IdGenerator.generateTaskId();
      const timestamp = new Date().toISOString();
      const dateCreated = new Date().toISOString().split('T')[0];

      // Crear carpeta: tareas/TSK-ID/
      const taskPath = `200-PROYECTOS/${input.parentObjectiveId}/tareas/${taskId}`;
      await vault.createFolder(taskPath);

      const filesCreated: string[] = [];

      // Crear TSK-ID.md (FolderNote)
      await FolderNoteService.createFolderNote(
        taskPath,
        taskId,
        {
          type: 'tarea',
          title: input.taskName,
          description: input.description,
          status: 'activo',
          dueDate: input.dueDate,
          dateCreated: dateCreated
        }
      );
      filesCreated.push(`${taskId}.md`);

      // Crear README.md
      const readmeContent = `---
type: tarea
title: ${input.taskName}
description: ${input.description}
dueDate: ${input.dueDate}
status: activo
dateCreated: ${dateCreated}
---

# ${input.taskName}

## Descripción

${input.description}

## Información

- **Vencimiento**: ${input.dueDate}
- **Estado**: activo

---

*Generado por obsidian-repo*
`;
      await vault.createFile(`${taskPath}/README.md`, readmeContent);
      filesCreated.push('README.md');

      // Auto-sync .index.json
      await IndexSyncService.updateIndexEntry('tarea', taskId, {
        type: 'tarea',
        title: input.taskName,
        description: input.description,
        dueDate: input.dueDate,
        status: 'activo',
        parentObjectiveId: input.parentObjectiveId,
        dateCreated: dateCreated,
        lastModified: timestamp
      });

      return {
        success: true,
        taskId: taskId,
        filesCreated: filesCreated
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
