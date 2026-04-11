/**
 * obsidian-repo - Plugin Principal
 * 
 * Punto de entrada del plugin para Obsidian.
 * Integra QuickAdd, Templater y otros plugins con nuestros servicios.
 * 
 * @see manifest.json para configuración del plugin
 */

import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  Notice,
  Command,
  WorkspaceLeaf,
} from 'obsidian';

import { ProjectService } from './services/createProject';
import { ProjectServiceWithVault } from './services/projectServiceWithVault';
import { ObjectiveService } from './services/createObjective';
import { ObjectiveServiceWithVault } from './services/objectiveServiceWithVault';
import { TaskService } from './services/createTask';
import { TaskServiceWithVault } from './services/taskServiceWithVault';
import { DocumentService } from './services/createDocument';
import { DocumentServiceWithVault } from './services/documentServiceWithVault';
import { ListService } from './services/listProjects';
import { EditService } from './services/editEntity';
import { EditServiceWithVault } from './services/editServiceWithVault';
import { DeleteService } from './services/deleteEntity';
import { DeleteServiceWithVault } from './services/deleteServiceWithVault';
import { ArchiveService } from './services/archiveEntity';
import { ArchiveServiceWithVault } from './services/archiveServiceWithVault';
import { TemplaterIntegration } from './services/templaterIntegration';
import { QuickAddIntegration } from './services/quickaddIntegration';
import { CrossPluginFlow } from './services/crossPluginFlow';
import { Validator } from './utils/validators';
import { IdGenerator } from './utils/generateUniqueId';

import { ProjectsView }, PROJECTS_VIEW_TYPE } from './projectsView';
import { TasksCalendarView }, TASKS_CALENDAR_VIEW_TYPE } from './tasksCalendarView';
import { KanbanView }, KANBAN_VIEW_TYPE } from './kanbanView';
import { FolderNoteService } from './services/folderNoteService';

import './views/views.css';
import './views/folderNote.css';

// Interfaz de configuración del plugin
interface ObsidianRepoSettings {
  inboxFolder: string;
  projectsFolder: string;
  repositoriesFolder: string;
  utilitiesFolder: string;
  enableLogging: boolean;
  enableNotifications: boolean;
  enableAutoBackup: boolean;
  language: 'es' | 'en';
}

const DEFAULT_SETTINGS: ObsidianRepoSettings = {
  inboxFolder: '100-INBOX',
  projectsFolder: '200-PROYECTOS',
  repositoriesFolder: '500-REPOSITORIOS',
  utilitiesFolder: '990-UTILIDADES',
  enableLogging: true,
  enableNotifications: true,
  enableAutoBackup: false,
  language: 'es',
};

/**
 * Plugin Principal de obsidian-repo
 */
export default class ObsidianRepoPlugin extends Plugin {
  settings: ObsidianRepoSettings;

  async onload() {
    console.log('[obsidian-repo] Loading plugin...');

    // Inicializar VaultAdapter PRIMERO
    ObsidianVaultAdapter.initialize(this.app);

    // Cargar configuración
    await this.loadSettings();

    // Crear estructura de carpetas
    await this.createVaultStructure();

    // Registrar vistas personalizadas
    this.registerViews();

    // Registrar comandos
    this.registerCommands();

    // Registrar settings tab
    this.addSettingTab(new ObsidianRepoSettingTab(this.app, this));

    // Registrar macros con QuickAdd
    await this.registerQuickAddMacros();

    // Registrar templates con Templater
    await this.registerTemplaterTemplates();

    console.log('[obsidian-repo] Plugin loaded successfully!');
    new Notice('obsidian-repo plugin loaded!');
  }

  onunload() {
    console.log('[obsidian-repo] Unloading plugin...');
  }

  /**
   * Crear estructura de carpetas base del vault
   */
  private async createVaultStructure(): Promise<void> {
    const folders = [
      this.settings.inboxFolder,
      this.settings.projectsFolder,
      this.settings.repositoriesFolder,
      this.settings.utilitiesFolder,
      `${this.settings.utilitiesFolder}/991-templates`,
      `${this.settings.utilitiesFolder}/992-script`,
      `${this.settings.utilitiesFolder}/audit`,
    ];

    for (const folderPath of folders) {
      try {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
          await this.app.vault.createFolder(folderPath);
          if (this.settings.enableLogging) {
            console.log(`[obsidian-repo] Created folder: ${folderPath}`);
          }
        }
      } catch (error) {
        console.warn(`[obsidian-repo] Could not create folder: ${folderPath}`, error);
      }
    }
  }

  /**
   * Registrar vistas personalizadas de Obsidian
   */
  private registerViews(): void {
    this.registerView(PROJECTS_VIEW_TYPE, (leaf) => new ProjectsView(leaf));
    this.registerView(TASKS_CALENDAR_VIEW_TYPE, (leaf) => new TasksCalendarView(leaf));
    this.registerView(KANBAN_VIEW_TYPE, (leaf) => new KanbanView(leaf));

    // Abrir vista de proyectos por defecto
    this.app.workspace.onLayoutReady(() => {
      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        leaf.setViewState({
          type: PROJECTS_VIEW_TYPE,
          active: true,
        });
      }
    });

    if (this.settings.enableLogging) {
      console.log('[obsidian-repo] Views registered: 3 (Projects, Calendar, Kanban)');
    }
  }

  /**
   * Registrar comandos de Obsidian
   */
  private registerCommands(): void {
    // UC-008: Create Project
    this.addCommand({
      id: 'create-project',
      name: 'Create new project',
      callback: () => this.handleCreateProject(),
      hotkey: 'Mod+Shift+P',
    });

    // UC-010: Create Objective
    this.addCommand({
      id: 'create-objective',
      name: 'Create new objective',
      callback: () => this.handleCreateObjective(),
      hotkey: 'Mod+Shift+O',
    });

    // UC-012: Create Task
    this.addCommand({
      id: 'create-task',
      name: 'Create new task',
      callback: () => this.handleCreateTask(),
      hotkey: 'Mod+Shift+T',
    });

    // UC-013: Create Document
    this.addCommand({
      id: 'create-document',
      name: 'Create new document',
      callback: () => this.handleCreateDocument(),
      hotkey: 'Mod+Shift+D',
    });

    // UC-015: List Projects
    this.addCommand({
      id: 'list-projects',
      name: 'List all projects',
      callback: () => this.handleListProjects(),
    });

    // UC-019: Edit Entity
    this.addCommand({
      id: 'edit-entity',
      name: 'Edit entity',
      callback: () => this.handleEditEntity(),
    });

    // UC-020: Delete Entity
    this.addCommand({
      id: 'delete-entity',
      name: 'Delete entity',
      callback: () => this.handleDeleteEntity(),
    });

    // UC-021: Archive Entity
    this.addCommand({
      id: 'archive-entity',
      name: 'Archive entity',
      callback: () => this.handleArchiveEntity(),
    });

    // View Commands
    this.addCommand({
      id: 'open-projects-view',
      name: 'Open Projects Dashboard',
      callback: () => this.openView(PROJECTS_VIEW_TYPE),
    });

    this.addCommand({
      id: 'open-tasks-calendar',
      name: 'Open Tasks Calendar',
      callback: () => this.openView(TASKS_CALENDAR_VIEW_TYPE),
    });

    this.addCommand({
      id: 'open-kanban',
      name: 'Open Tasks Kanban',
      callback: () => this.openView(KANBAN_VIEW_TYPE),
    });

    if (this.settings.enableLogging) {
      console.log('[obsidian-repo] Commands registered: 11');
    }
  }

  /**
   * Abrir una vista específica
   */
  private openView(viewType: string): void {
    const leaf =
      this.app.workspace.getLeaf(false) || this.app.workspace.getLeaf(true);
    leaf.setViewState({
      type: viewType,
      active: true,
    });
  }

  /**
   * Handlers para cada comando
   */

  private async handleCreateProject(): Promise<void> {
    const projectName = await this.promptInput('Project name:', 'My Project');
    if (!projectName) return;

    const description = await this.promptInput('Project description:', '');
    const priority = await this.promptSelect(
      'Priority:',
      ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'],
      'MEDIA'
    );

    try {
      // Usar servicio mejorado con integración de vault
      const result = await ProjectServiceWithVault.createProjectWithVault({
        projectName,
        description,
        priority: priority as 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA',
      });

      if (result.success) {
        new Notice(`Project "${projectName}" created successfully!`);
        if (this.settings.enableLogging) {
          console.log('[obsidian-repo] Project created:', result.projectId);
        }
      } else {
        new Notice(`Error: ${result.error}`);
      }
    } catch (error) {
      new Notice(`Error creating project: ${error}`);
      console.error('[obsidian-repo] Error:', error);
    }
  }

  private async handleCreateObjective(): Promise<void> {
    const objectiveName = await this.promptInput('Objective name:', 'My Objective');
    if (!objectiveName) return;

    const description = await this.promptInput('Objective description:', '');
    const priority = await this.promptSelect(
      'Priority:',
      ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'],
      'MEDIA'
    );

    try {
      const result = await ObjectiveServiceWithVault.createObjectiveWithVault({
        objectiveName,
        description,
        priority: priority as 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA',
      });

      if (result.success) {
        new Notice(`Objective "${objectiveName}" created!`);
      } else {
        new Notice(`Error: ${result.error}`);
      }
    } catch (error) {
      new Notice(`Error creating objective: ${error}`);
    }
  }

  private async handleCreateTask(): Promise<void> {
    const taskName = await this.promptInput('Task name:', 'My Task');
    if (!taskName) return;

    const description = await this.promptInput('Task description:', '');
    const priority = await this.promptSelect(
      'Priority:',
      ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'],
      'MEDIA'
    );
    const dueDate = await this.promptInput('Due date (YYYY-MM-DD):', '');

    try {
      const result = await TaskServiceWithVault.createTaskWithVault({
        taskName,
        description,
        priority: priority as 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA',
        dueDate: dueDate || undefined,
      });

      if (result.success) {
        new Notice(`Task "${taskName}" created!`);
      } else {
        new Notice(`Error: ${result.error}`);
      }
    } catch (error) {
      new Notice(`Error creating task: ${error}`);
    }
  }

  private async handleCreateDocument(): Promise<void> {
    const documentName = await this.promptInput('Document name:', 'My Document');
    if (!documentName) return;

    const description = await this.promptInput('Document description:', '');
    const category = await this.promptInput('Category (optional):', 'General');

    try {
      const result = await DocumentServiceWithVault.createDocumentWithVault({
        documentName,
        description,
        category: category || undefined,
      });

      if (result.success) {
        new Notice(`Document "${documentName}" created!`);
      } else {
        new Notice(`Error: ${result.error}`);
      }
    } catch (error) {
      new Notice(`Error creating document: ${error}`);
    }
  }

  private async handleListProjects(): Promise<void> {
    try {
      const projects = await ProjectServiceWithVault.listProjectsFromVault();
      
      if (projects.length === 0) {
        new Notice('No projects found');
        return;
      }

      const projectList = projects
        .map((p) => `• ${p.frontmatter?.title || 'Unknown'} (${p.projectId})`)
        .join('\n');

      new Notice(`Projects:\n${projectList}`);
    } catch (error) {
      new Notice(`Error listing projects: ${error}`);
      console.error('[obsidian-repo] Error:', error);
    }
  }

  private async handleEditEntity(): Promise<void> {
    new Notice('Edit entity feature - implement as needed');
  }

  private async handleDeleteEntity(): Promise<void> {
    new Notice('Delete entity feature - implement as needed');
  }

  private async handleArchiveEntity(): Promise<void> {
    new Notice('Archive entity feature - implement as needed');
  }

  /**
   * Registrar macros con QuickAdd
   */
  private async registerQuickAddMacros(): Promise<void> {
    try {
      await QuickAddIntegration.registerDefaultMacros();
      if (this.settings.enableLogging) {
        console.log('[obsidian-repo] QuickAdd macros registered');
      }
    } catch (error) {
      console.warn('[obsidian-repo] Could not register QuickAdd macros:', error);
    }
  }

  /**
   * Registrar templates con Templater
   */
  private async registerTemplaterTemplates(): Promise<void> {
    try {
      const templates = [
        {
          id: 'project-template',
          name: 'Project Template',
          description: 'Template for creating projects',
          filePath: `${this.settings.utilitiesFolder}/991-templates/project-template.md`,
          templateType: 'project' as const,
          variables: {
            projectName: 'Project Name',
            description: 'Description',
          },
        },
      ];

      for (const template of templates) {
        await TemplaterIntegration.registerTemplate(template);
      }

      if (this.settings.enableLogging) {
        console.log('[obsidian-repo] Templater templates registered');
      }
    } catch (error) {
      console.warn('[obsidian-repo] Could not register Templater templates:', error);
    }
  }

  /**
   * Utilidades de UI
   */

  private async promptInput(
    message: string,
    defaultValue: string = ''
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.placeholder = message;

      const dialog = document.createElement('div');
      dialog.innerHTML = `
        <div style="padding: 20px; border: 1px solid var(--background-secondary-alt); border-radius: 8px;">
          <label style="display: block; margin-bottom: 10px;">${message}</label>
          <input type="text" value="${defaultValue}" style="width: 100%; padding: 8px; margin-bottom: 10px;" id="promptInput" />
          <button id="promptOk" style="padding: 8px 16px; margin-right: 10px;">OK</button>
          <button id="promptCancel" style="padding: 8px 16px;">Cancel</button>
        </div>
      `;

      const promptEl = document.querySelector('#promptInput') as HTMLInputElement;

      document.querySelector('#promptOk')?.addEventListener('click', () => {
        resolve(promptEl.value);
        dialog.remove();
      });

      document.querySelector('#promptCancel')?.addEventListener('click', () => {
        resolve(null);
        dialog.remove();
      });
    });
  }

  private async promptSelect(
    message: string,
    options: string[],
    defaultValue: string
  ): Promise<string> {
    new Notice(`${message} ${options.join(', ')}`);
    return defaultValue;
  }

  /**
   * Cargar/Guardar configuración
   */

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

/**
 * Settings Tab de Obsidian
 */
class ObsidianRepoSettingTab extends PluginSettingTab {
  plugin: ObsidianRepoPlugin;

  constructor(app: App, plugin: ObsidianRepoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Inbox Folder')
      .setDesc('Folder for fleeting notes')
      .addText((text) =>
        text
          .setPlaceholder('100-INBOX')
          .setValue(this.plugin.settings.inboxFolder)
          .onChange(async (value) => {
            this.plugin.settings.inboxFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Projects Folder')
      .setDesc('Folder for projects')
      .addText((text) =>
        text
          .setPlaceholder('200-PROYECTOS')
          .setValue(this.plugin.settings.projectsFolder)
          .onChange(async (value) => {
            this.plugin.settings.projectsFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Repositories Folder')
      .setDesc('Folder for documents')
      .addText((text) =>
        text
          .setPlaceholder('500-REPOSITORIOS')
          .setValue(this.plugin.settings.repositoriesFolder)
          .onChange(async (value) => {
            this.plugin.settings.repositoriesFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Enable Logging')
      .setDesc('Log plugin activity to console')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableLogging)
          .onChange(async (value) => {
            this.plugin.settings.enableLogging = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Enable Notifications')
      .setDesc('Show notifications when creating/editing entities')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableNotifications)
          .onChange(async (value) => {
            this.plugin.settings.enableNotifications = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Plugin language')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('es', 'Español')
          .addOption('en', 'English')
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as 'es' | 'en';
            await this.plugin.saveSettings();
          })
      );

    // ========== FOLDER ABOUT SETTINGS ==========
    containerEl.createEl('h3', { text: 'Folder About Notes (_about_)' });

    new Setting(containerEl)
      .setName('Auto-generate _about_ notes')
      .setDesc('Automatically create _about_.md files for each folder')
      .addToggle((toggle) =>
        toggle
          .setValue(true)
          .onChange(async (value) => {
            if (this.plugin.settings.enableLogging) {
              console.log('[obsidian-repo] Folder About auto-generate:', value);
            }
          })
      );

    new Setting(containerEl)
      .setName('Hide _about_ files in sidebar')
      .setDesc('Hide _about_.md files from the file explorer tree')
      .addToggle((toggle) =>
        toggle
          .setValue(false)
          .onChange(async (value) => {
            if (this.plugin.settings.enableLogging) {
              console.log('[obsidian-repo] Hide _about_ files:', value);
            }
          })
      );

    new Setting(containerEl)
      .setName('Card view type for _about_ notes')
      .setDesc('Display style for folder descriptions')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('cute', 'Cute Cards (3 columns)')
          .addOption('strip', 'Strip Cards (horizontal)')
          .setValue('cute')
          .onChange(async (value) => {
            if (this.plugin.settings.enableLogging) {
              console.log('[obsidian-repo] Card view type:', value);
            }
          })
      );

    new Setting(containerEl)
      .setName('Auto-update _about_ content')
      .setDesc('Update _about_ notes when editing entity metadata')
      .addToggle((toggle) =>
        toggle
          .setValue(true)
          .onChange(async (value) => {
            if (this.plugin.settings.enableLogging) {
              console.log('[obsidian-repo] Auto-update _about_:', value);
            }
          })
      );
  }
}
