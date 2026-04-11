/**
 * ObjectiveServiceWithVault - GREEN Implementation
 * UC-010: Crear Objetivo (8 tests)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { IdGenerator } from '../utils/generateUniqueId';

export interface CreateObjectiveInput {
  objectiveName: string;
  description: string;
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  parentProjectId: string;
}

export interface CreateObjectiveOutput {
  success: boolean;
  objectiveId?: string;
  filesCreated?: string[];
  error?: string;
}

export class ObjectiveServiceWithVault {
  static async createObjectiveWithVault(input: CreateObjectiveInput): Promise<CreateObjectiveOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.objectiveName || !input.description || !input.parentProjectId) {
        return { success: false, error: 'Missing required fields' };
      }

      // Generar ID: OBJ-YYYYMM-XXXXX
      const objectiveId = await IdGenerator.generateObjectiveId();
      const timestamp = new Date().toISOString();
      const dateCreated = new Date().toISOString().split('T')[0];

      // Crear carpeta: objetivos/OBJ-ID/
      const objectivePath = `200-PROYECTOS/${input.parentProjectId}/objetivos/${objectiveId}`;
      await vault.createFolder(objectivePath);

      const filesCreated: string[] = [];

      // Crear OBJ-ID.md (FolderNote)
      await FolderNoteService.createFolderNote(
        objectivePath,
        objectiveId,
        {
          type: 'objetivo',
          title: input.objectiveName,
          description: input.description,
          status: 'activo',
          priority: input.priority,
          dateCreated: dateCreated
        }
      );
      filesCreated.push(`${objectiveId}.md`);

      // Crear README.md
      const readmeContent = `---
type: objetivo
title: ${input.objectiveName}
description: ${input.description}
priority: ${input.priority}
status: activo
dateCreated: ${dateCreated}
---

# ${input.objectiveName}

## Descripción

${input.description}

---

*Generado por obsidian-repo*
`;
      await vault.createFile(`${objectivePath}/README.md`, readmeContent);
      filesCreated.push('README.md');

      // Auto-sync .index.json
      await IndexSyncService.updateIndexEntry('objetivo', objectiveId, {
        type: 'objetivo',
        title: input.objectiveName,
        description: input.description,
        priority: input.priority,
        status: 'activo',
        parentProjectId: input.parentProjectId,
        dateCreated: dateCreated,
        lastModified: timestamp
      });

      return {
        success: true,
        objectiveId: objectiveId,
        filesCreated: filesCreated
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
