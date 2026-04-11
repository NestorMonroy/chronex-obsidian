/**
 * ListServiceWithVault - GREEN Implementation
 * UC-015: Listar Proyectos (7 tests)
 */

import { ObsidianVaultAdapter } } from './obsidianVaultAdapter';

export interface ListProjectsOutput {
  success: boolean;
  projects?: any[];
  total?: number;
  error?: string;
}

export class ListServiceWithVault {
  static async listProjects(): Promise<ListProjectsOutput> {
    const vault = ObsidianVaultAdapter.getInstance();

    try {
      // Leer .index.json
      const indexContent = await vault.readFile('.index.json');
      const index = JSON.parse(indexContent);

      // Retornar projects[] ordenado por lastModified (DESC)
      const projects = (index.projects || []).sort((a: any, b: any) => {
        const dateA = new Date(a.lastModified).getTime();
        const dateB = new Date(b.lastModified).getTime();
        return dateB - dateA; // DESC order
      });

      return {
        success: true,
        projects: projects,
        total: projects.length
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
