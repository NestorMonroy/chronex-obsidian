/**
 * ProjectServiceWithVault - Integración Real con Obsidian Vault
 * 
 * Extiende createProject.ts para funcionar con archivos reales en Obsidian.
 * Usa ObsidianVaultAdapter para todas las operaciones de file system.
 * 
 * Flujo:
 * 1. Validar entrada
 * 2. Generar ID único
 * 3. Crear estructura de carpetas
 * 4. Crear README.md con frontmatter y contenido
 * 5. Crear _about_.md con FolderNoteService
 * 6. Registrar en índice de proyectos
 * 7. Notificar usuario
 */

import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { FolderNoteService } from './folderNoteService';
import { IndexSyncService } from './indexSyncService';
import { ProjectService } from './createProject';
import { IdGenerator } from '../utils/generateUniqueId';
import { Validator } from '../utils/validators';

export interface ProjectWithVaultInput {
  projectName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
}

export interface ProjectWithVaultResult {
  success: boolean;
  projectId?: string;
  folderPath?: string;
  notePath?: string;
  frontmatter?: Record<string, any>;
  message?: string;
  error?: string;
}

export class ProjectServiceWithVault {
  private static readonly PROJECT_PREFIX = 'PROJ';
  private static readonly PROJECTS_FOLDER = '200-PROYECTOS';
  private static readonly INDEX_FILE = '200-PROYECTOS/.index.json';

  static async createProjectWithVault(
    input: ProjectWithVaultInput
  ): Promise<ProjectWithVaultResult> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // 1. VALIDAR
      const validation = Validator.validateProjectInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // 2. GENERAR ID
      const projectId = IdGenerator.generateCustomId(this.PROJECT_PREFIX);
      console.log(`[ProjectService] Generated ID: ${projectId}`);

      // 3. CREAR CARPETA
      const folderPath = `${this.PROJECTS_FOLDER}/${projectId}`;
      await vault.createFolder(folderPath);

      const subfolders = ['objetivos', 'documentos', 'recursos'];
      for (const subfolder of subfolders) {
        await vault.createFolder(`${folderPath}/${subfolder}`);
      }

      // 4. CREAR README.md CON FRONTMATTER
      const dateCreated = new Date().toISOString().split('T')[0];
      const frontmatter = {
        uid: projectId,
        type: 'proyecto',
        title: input.projectName,
        description: input.description || '',
        priority: input.priority || 'MEDIA',
        dateCreated,
        status: 'activo',
      };

      const content = this.generateProjectContent(frontmatter);
      const notePath = `${folderPath}/README.md`;

      await vault.createFile(notePath, content);

      // 5. CREAR _about_.md CON FOLDERABOUTSERVICE
      await FolderNoteService.createAboutNote(folderPath, {
        type: 'proyecto',
        title: input.projectName,
        description: input.description,
        dateCreated,
        status: 'activo',
        icon: 'PRJ'
      });

      // 6. CREAR FOLDERNTE PARA SUBCARPETAS
      const subfolders = ['objetivos', 'documentos', 'recursos'];
      for (const subfolder of subfolders) {
        const subfolderPath = `${folderPath}/${subfolder}`;
        await FolderNoteService.createFolderNote(subfolderPath, {
          type: 'carpeta',
          title: subfolder.charAt(0).toUpperCase() + subfolder.slice(1),
          description: `Carpeta para almacenar ${subfolder}`,
          parentId: projectId,
          dateCreated,
          status: 'activo',
          icon: '📂'
        });
      }

      // 7. REGISTRAR EN ÍNDICE LOCAL
      await this.addToIndex(projectId, {
        projectName: input.projectName,
        description: input.description,
        priority: input.priority,
        dateCreated,
        folderPath,
      });

      // 7B. SINCRONIZAR CON ÍNDICE GLOBAL
      await IndexSyncService.updateIndexEntry('proyecto', projectId, {
        title: input.projectName,
        path: folderPath,
        description: input.description,
        status: 'activo',
        priority: input.priority || 'MEDIA',
        dateCreated
      });

      // 8. NOTIFICAR
      vault.showSuccessNotice(`Proyecto "${input.projectName}" creado exitosamente!`);

      console.log(`[ProjectService] Project created:`, {
        projectId,
        folderPath,
        notePath,
      });

      return {
        success: true,
        projectId,
        folderPath,
        notePath,
        frontmatter,
        message: `Project "${input.projectName}" created successfully!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vault.showErrorNotice(`Error creating project: ${errorMessage}`);

      console.error('[ProjectService] Error:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generar contenido de README.md con frontmatter
   */
  private static generateProjectContent(
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

## Estructura
- **Objetivos** - En carpeta \`objetivos/\`
- **Documentos** - En carpeta \`documentos/\`
- **Recursos** - Enlaces y referencias útiles

## Próximos Pasos
1. [ ] Definir objetivos principales
2. [ ] Crear subtareas
3. [ ] Asignar documentos de referencia
4. [ ] Establecer timeline

## Notas
Proyecto creado automáticamente con obsidian-repo plugin.
`;
  }

  /**
   * Agregar proyecto al índice
   */
  private static async addToIndex(
    projectId: string,
    projectData: Record<string, any>
  ): Promise<void> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      let indexContent = '[]';
      const indexExists = await vault.fileExists(this.INDEX_FILE);

      if (indexExists) {
        indexContent = await vault.readFile(this.INDEX_FILE);
      }

      const projects = JSON.parse(indexContent) || [];
      projects.push({
        projectId,
        ...projectData,
        indexedAt: new Date().toISOString(),
      });

      await vault.createFile(
        this.INDEX_FILE,
        JSON.stringify(projects, null, 2),
        true
      );

      console.log(`[ProjectService] Added to index:`, projectId);
    } catch (error) {
      console.warn('[ProjectService] Could not update index:', error);
      // No es crítico si falla el índice
    }
  }

  /**
   * Listar proyectos desde el vault
   */
  static async listProjectsFromVault(): Promise<ProjectWithVaultResult[]> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      const folderPath = this.PROJECTS_FOLDER;
      const folders = await vault.getFolders(folderPath);

      const projects = await Promise.all(
        folders.map(async (folder) => {
          try {
            const files = await vault.getFiles(folder.path);
            const readmeFile = files.find((f) => f.name === 'README.md');

            if (!readmeFile) {
              return null;
            }

            const content = await vault.readFile(readmeFile.path);
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (!frontmatterMatch) {
              return null;
            }

            const frontmatterString = frontmatterMatch[1];
            const frontmatter: Record<string, any> = {};

            frontmatterString.split('\n').forEach((line) => {
              const [key, ...valueParts] = line.split(': ');
              if (key && valueParts.length > 0) {
                frontmatter[key.trim()] = valueParts.join(': ').trim();
              }
            });

            return {
              success: true,
              projectId: frontmatter.uid,
              folderPath: folder.path,
              notePath: readmeFile.path,
              frontmatter,
            };
          } catch (error) {
            console.warn(`[ProjectService] Error reading project ${folder.path}:`, error);
            return null;
          }
        })
      );

      return projects.filter((p): p is ProjectWithVaultResult => p !== null);
    } catch (error) {
      console.error('[ProjectService] Error listing projects:', error);
      return [];
    }
  }
}

export const projectServiceWithVault = {
  create: (input: ProjectWithVaultInput) =>
    ProjectServiceWithVault.createProjectWithVault(input),
  list: () => ProjectServiceWithVault.listProjectsFromVault(),
};
