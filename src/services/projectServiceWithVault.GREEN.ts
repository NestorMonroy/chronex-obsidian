/**
 * ProjectServiceWithVault - GREEN Implementation
 * 
 * Implementación basada en UC-008 (UC-MASTER.md)
 * Debe pasar los 35 tests de projectServiceWithVault.test.tdd.ts
 * 
 * Patrón: CADA CARPETA = SU FOLDERNTE
 * 
 * UC-008: Crear Proyecto
 * Input: projectName, description, priority
 * Output: success, projectId, folderPath, filesCreated, timestamp
 * Archivos: 6 (PROJ-ID.md, README.md, objetivos.md, documentos.md, tareas.md, recursos.md)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface CreateProjectInput {
  projectName: string;
  description: string;
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
}

export interface CreateProjectOutput {
  success: boolean;
  projectId?: string;
  folderPath?: string;
  filesCreated?: string[];
  timestamp?: string;
  error?: string;
}

export class ProjectServiceWithVault {
  private static readonly BASE_PATH = '200-PROYECTOS';
  private static readonly COLLECTIONS = ['objetivos', 'documentos', 'tareas', 'recursos'];

  /**
   * Crear proyecto con estructura completa y auto-sync
   * 
   * Pasos (de UC-008):
   * 1. Validar input
   * 2. Generar ID (PROJ-YYYYMM-XXXXX)
   * 3. Crear carpeta principal
   * 4. Crear files (PROJ-ID.md, README.md)
   * 5. Crear carpetas de colecciones + folderNotes
   * 6. Sincronizar .index.json
   */
  static async createProjectWithVault(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // PASO 1: Validar Input (Input Validation tests)
      if (!input.projectName || input.projectName.trim().length === 0) {
        return { success: false, error: 'projectName is required' };
      }

      if (input.projectName.length > 100) {
        return { success: false, error: 'projectName must be ≤ 100 characters' };
      }

      if (!input.description || input.description.trim().length === 0) {
        return { success: false, error: 'description is required' };
      }

      if (input.description.length > 500) {
        return { success: false, error: 'description must be ≤ 500 characters' };
      }

      const validPriorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
      if (!validPriorities.includes(input.priority)) {
        return { success: false, error: 'priority must be one of: BAJA, MEDIA, ALTA, CRÍTICA' };
      }

      // PASO 2: Generar ID (ID Generation tests)
      // Formato: PROJ-YYYYMM-XXXXX
      const projectId = await IdGenerator.generateProjectId(); // Ej: PROJ-202604-ABC

      // PASO 3: Crear carpeta principal
      const folderPath = `${this.BASE_PATH}/${projectId}`;
      await vault.createFolder(folderPath);

      // PASO 4: Crear FILES en carpeta principal
      const filesCreated: string[] = [];

      // 4a. Crear PROJ-ID.md (FolderNote) - AUTO por FolderNoteService
      const timestamp = new Date().toISOString();
      const dateCreated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      await FolderNoteService.createFolderNote(
        folderPath,
        projectId, // nombre = ID
        {
          type: 'proyecto',
          title: input.projectName,
          description: input.description,
          status: 'activo',
          priority: input.priority,
          dateCreated: dateCreated
        }
      );
      filesCreated.push(`${projectId}.md`); // PROJ-202604-ABC.md

      // 4b. Crear README.md
      const readmeContent = this.generateReadmeContent(
        'proyecto',
        input.projectName,
        input.description,
        input.priority,
        dateCreated
      );
      await vault.createFile(`${folderPath}/README.md`, readmeContent);
      filesCreated.push('README.md');

      // PASO 5: Crear CARPETAS DE COLECCIONES + folderNotes
      // Crear: objetivos/, documentos/, tareas/, recursos/
      // Cada una con su folderNote (nombre = carpeta)
      for (const collection of this.COLLECTIONS) {
        const collectionPath = `${folderPath}/${collection}`;
        await vault.createFolder(collectionPath);

        // Auto-crear folderNote para la colección
        await FolderNoteService.createFolderNote(
          collectionPath,
          collection, // nombre = nombre de carpeta
          {
            type: 'colección',
            title: collection.charAt(0).toUpperCase() + collection.slice(1),
            description: `Colección de ${collection}`,
            status: 'activo',
            dateCreated: dateCreated
          }
        );

        filesCreated.push(`${collection}.md`); // objetivos.md, documentos.md, etc.
      }

      // PASO 6: Auto-sincronizar .index.json
      await IndexSyncService.updateIndexEntry('proyecto', projectId, {
        type: 'proyecto',
        title: input.projectName,
        description: input.description,
        status: 'activo',
        priority: input.priority,
        path: folderPath,
        dateCreated: dateCreated,
        lastModified: timestamp
      });

      // Preparar output
      const output: CreateProjectOutput = {
        success: true,
        projectId: projectId,
        folderPath: folderPath,
        filesCreated: filesCreated, // Debe tener 6 archivos
        timestamp: timestamp
      };

      vault.showSuccessNotice(`Proyecto "${input.projectName}" creado exitosamente`);
      console.log('[ProjectService] Proyecto creado:', output);

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error creating project: ${errorMessage}`);
      console.error('[ProjectService] Error:', error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generar contenido de README.md
   */
  private static generateReadmeContent(
    type: string,
    title: string,
    description: string,
    priority?: string,
    dateCreated?: string
  ): string {
    const priorityLine = priority ? `\npriority: ${priority}` : '';
    const dateCreatedLine = dateCreated ? `\ndateCreated: ${dateCreated}` : '';

    return `---
type: ${type}
title: ${title}
description: ${description}${priorityLine}
status: activo${dateCreatedLine}
---

# ${title}

## Descripción

${description}

## Información

- **Tipo**: ${type}
- **Estado**: activo
${priority ? `- **Prioridad**: ${priority}` : ''}
${dateCreated ? `- **Creado**: ${dateCreated}` : ''}

---

*Generado por obsidian-repo*
`;
  }
}
