/**
 * DocumentServiceWithVault - GREEN Implementation
 * UC-013: Crear Documento (10 tests)
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { IdGenerator } from '../utils/generateUniqueId';

export interface CreateDocumentInput {
  documentName: string;
  description: string;
  category: string; // General, Técnico, Legal
}

export interface CreateDocumentOutput {
  success: boolean;
  documentId?: string;
  filesCreated?: string[];
  error?: string;
}

export class DocumentServiceWithVault {
  static async createDocumentWithVault(input: CreateDocumentInput): Promise<CreateDocumentOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Validar input
      if (!input.documentName || !input.description || !input.category) {
        return { success: false, error: 'Missing required fields' };
      }

      // Generar ID: DOC-YYYYMM-XXXXX
      const documentId = await IdGenerator.generateDocumentId();
      const timestamp = new Date().toISOString();
      const dateCreated = new Date().toISOString().split('T')[0];

      const filesCreated: string[] = [];

      // Verificar si categoría existe, si no crearla
      const categoryPath = `500-REPOSITORIOS/${input.category}`;
      const categoryExists = await vault.folderExists(categoryPath);

      if (!categoryExists) {
        // Crear carpeta categoría
        await vault.createFolder(categoryPath);

        // Crear {Category}.md (FolderNote de categoría)
        await FolderNoteService.createFolderNote(
          categoryPath,
          input.category,
          {
            type: 'categoría',
            title: input.category,
            description: `Categoría: ${input.category}`,
            status: 'activo',
            dateCreated: dateCreated
          }
        );
        filesCreated.push(`${input.category}.md`);
      }

      // Crear carpeta documento: {Category}/DOC-ID/
      const documentPath = `${categoryPath}/${documentId}`;
      await vault.createFolder(documentPath);

      // Crear DOC-ID.md (FolderNote)
      await FolderNoteService.createFolderNote(
        documentPath,
        documentId,
        {
          type: 'documento',
          title: input.documentName,
          description: input.description,
          status: 'activo',
          category: input.category,
          dateCreated: dateCreated
        }
      );
      filesCreated.push(`${documentId}.md`);

      // Crear README.md
      const readmeContent = `---
type: documento
title: ${input.documentName}
description: ${input.description}
category: ${input.category}
status: activo
dateCreated: ${dateCreated}
---

# ${input.documentName}

## Descripción

${input.description}

## Información

- **Categoría**: ${input.category}
- **Estado**: activo

---

*Generado por obsidian-repo*
`;
      await vault.createFile(`${documentPath}/README.md`, readmeContent);
      filesCreated.push('README.md');

      // Auto-sync .index.json
      await IndexSyncService.updateIndexEntry('documento', documentId, {
        type: 'documento',
        title: input.documentName,
        description: input.description,
        category: input.category,
        status: 'activo',
        dateCreated: dateCreated,
        lastModified: timestamp
      });

      return {
        success: true,
        documentId: documentId,
        filesCreated: filesCreated
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
