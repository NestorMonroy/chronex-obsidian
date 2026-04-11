import { FolderNoteService } from './folderNoteService';
/**
 * DocumentServiceWithVault - Integración Real con Obsidian Vault
 * Crea documentos en la estructura de repositorios
 */

import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface DocumentWithVaultInput {
  documentName: string;
  description?: string;
  category?: string;
}

export interface DocumentWithVaultResult {
  success: boolean;
  documentId?: string;
  folderPath?: string;
  notePath?: string;
  frontmatter?: Record<string, any>;
  message?: string;
  error?: string;
}

export class DocumentServiceWithVault {
  private static readonly DOCUMENT_PREFIX = 'DOC';
  private static readonly REPOSITORIES_FOLDER = '500-REPOSITORIOS';

  static async createDocumentWithVault(
    input: DocumentWithVaultInput
  ): Promise<DocumentWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateDocumentInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. GENERAR ID
      const documentId = IdGenerator.generateCustomId(this.DOCUMENT_PREFIX);

      // 3. DETERMINAR RUTA - con categoría opcional
      let folderPath: string;
      if (input.category) {
        folderPath = `${this.REPOSITORIES_FOLDER}/${input.category}/${documentId}`;
      } else {
        folderPath = `${this.REPOSITORIES_FOLDER}/${documentId}`;
      }

      await vault.createFolder(folderPath);

      // 4. CREAR README.md
      const dateCreated = new Date().toISOString().split('T')[0];
      const frontmatter = {
        uid: documentId,
        type: 'documento',
        title: input.documentName,
        description: input.description || '',
        category: input.category || 'General',
        dateCreated,
        status: 'activo',
      };

      const content = this.generateDocumentContent(frontmatter);
      const notePath = `${folderPath}/README.md`;

      await vault.createFile(notePath, content);

      // CREAR FOLDERNTE
      await FolderNoteService.createFolderNote(folderPath, {
        type: 'documento',
        title: input.documentName,
        description: input.description,
        parentId: input.category,
        dateCreated,
        status: 'activo',
        icon: '📄'
      });

      // SINCRONIZAR CON ÍNDICE GLOBAL
      await IndexSyncService.updateIndexEntry('documento', documentId, {
        title: input.documentName,
        path: folderPath,
        description: input.description,
        status: 'activo',
        priority: 'MEDIA',
        dateCreated
      });

      vault.showSuccessNotice(`Documento "${input.documentName}" creado!`);

      return {
        success: true,
        documentId,
        folderPath,
        notePath,
        frontmatter,
        message: `Document "${input.documentName}" created successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error creating document: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private static generateDocumentContent(
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
- **Categoría**: ${frontmatter.category}
- **Creado**: ${frontmatter.dateCreated}
- **Estado**: ${frontmatter.status}

## Contenido
<!-- Agregar contenido aquí -->

## Referencias
<!-- Enlaces a otros documentos -->

## Historial
- Creado: ${frontmatter.dateCreated}
`;
  }

  static async listDocumentsFromVault(
    category?: string
  ): Promise<DocumentWithVaultResult[]> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      let folderPath: string;
      if (category) {
        folderPath = `${this.REPOSITORIES_FOLDER}/${category}`;
      } else {
        folderPath = this.REPOSITORIES_FOLDER;
      }

      const folders = await vault.getFolders(folderPath);

      const documents = await Promise.all(
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
              documentId: frontmatter.uid,
              folderPath: folder.path,
              notePath: readmeFile.path,
              frontmatter,
            };
          } catch (error) {
            return null;
          }
        })
      );

      return documents.filter((d): d is DocumentWithVaultResult => d !== null);
    } catch (error) {
      console.error('[DocumentService] Error listing documents:', error);
      return [];
    }
  }
}

export const documentServiceWithVault = {
  create: (input: DocumentWithVaultInput) =>
    DocumentServiceWithVault.createDocumentWithVault(input),
  list: (category?: string) =>
    DocumentServiceWithVault.listDocumentsFromVault(category),
};
