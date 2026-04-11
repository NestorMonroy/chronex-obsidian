/**
 * ProjectsView - Dashboard de Proyectos
 * Muestra todos los proyectos con estadísticas
 */

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { ProjectServiceWithVault } from '../services/projectServiceWithVault';
import { ObjectiveServiceWithVault } from '../services/objectiveServiceWithVault';

export const PROJECTS_VIEW_TYPE = 'chronex-obsidian-projects';

interface ProjectStats {
  projectId: string;
  title: string;
  priority: string;
  status: string;
  objectiveCount: number;
  dateCreated: string;
}

export class ProjectsView extends ItemView {
  private projects: ProjectStats[] = [];

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return PROJECTS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Projects Dashboard';
  }

  getIcon(): string {
    return 'briefcase';
  }

  async onOpen(): Promise<void> {
    await this.refresh();
    this.registerInterval(window.setInterval(() => this.refresh(), 60000));
  }

  async refresh(): Promise<void> {
    const projects = await ProjectServiceWithVault.listProjectsFromVault();

    this.projects = await Promise.all(
      projects.map(async (p) => {
        const objectives = await ObjectiveServiceWithVault.listObjectivesFromVault(
          p.projectId
        );

        return {
          projectId: p.projectId || '',
          title: p.frontmatter?.title || 'Unknown',
          priority: p.frontmatter?.priority || 'MEDIA',
          status: p.frontmatter?.status || 'activo',
          objectiveCount: objectives.length,
          dateCreated: p.frontmatter?.dateCreated || '',
        };
      })
    );

    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Projects Dashboard' });

    this.renderStats(contentEl);
    this.renderProjectsList(contentEl);
    this.renderButtons(contentEl);
  }

  private renderStats(container: HTMLElement): void {
    const statsEl = container.createEl('div', { cls: 'projects-stats' });

    const totalProjects = this.projects.length;
    const activeProjects = this.projects.filter((p) => p.status === 'activo').length;
    const archivedProjects = this.projects.filter((p) => p.status === 'archivado').length;
    const totalObjectives = this.projects.reduce((sum, p) => sum + p.objectiveCount, 0);

    statsEl.createEl('div', { cls: 'stat-card' }).innerHTML = `
      <strong>${totalProjects}</strong> Total Projects
    `;

    statsEl.createEl('div', { cls: 'stat-card' }).innerHTML = `
      <strong>${activeProjects}</strong> Active
    `;

    statsEl.createEl('div', { cls: 'stat-card' }).innerHTML = `
      <strong>${totalObjectives}</strong> Objectives
    `;

    statsEl.createEl('div', { cls: 'stat-card' }).innerHTML = `
      <strong>${archivedProjects}</strong> Archived
    `;
  }

  private renderProjectsList(container: HTMLElement): void {
    const listEl = container.createEl('div', { cls: 'projects-list' });

    if (this.projects.length === 0) {
      listEl.createEl('p', {
        text: 'No projects found. Create one with Cmd+Shift+P',
      });
      return;
    }

    const table = listEl.createEl('table');

    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Project' });
    headerRow.createEl('th', { text: 'Priority' });
    headerRow.createEl('th', { text: 'Status' });
    headerRow.createEl('th', { text: 'Objectives' });

    const tbody = table.createEl('tbody');
    this.projects.forEach((project) => {
      const row = tbody.createEl('tr');
      row.createEl('td', { text: project.title });
      row.createEl('td', { text: project.priority });
      row.createEl('td', { text: project.status });
      row.createEl('td', { text: String(project.objectiveCount) });
    });
  }

  private renderButtons(container: HTMLElement): void {
    const buttonGroup = container.createEl('div');

    const refreshBtn = container.createEl('button', { text: 'Refresh' });
    refreshBtn.addEventListener('click', () => this.refresh());

    const newProjectBtn = container.createEl('button', { text: 'New Project' });
    newProjectBtn.addEventListener('click', () => {
      this.app.commands.executeCommandById('create-project');
    });
  }
}
