/**
 * Obsidian Repository Manager Plugin
 * 
 * Automated repository, task, project, and pillar management
 * with QuickAdd and Templater integration.
 * 
 * @author Nestor Monroy
 * @version 1.0.0
 */

import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	Command
} from 'obsidian';

// Import utility modules
import validateCommonInput from './utils/validateCommonInput';
import generateUniqueId from './utils/generateUniqueId';
import getCurrentDateTime from './utils/getCurrentDateTime';
import getAuthorName from './utils/getAuthorName';
import getFileName from './utils/getFileName';

// Import helpers
import { normalizeText } from './utils/helpers/normalize';
import { isValidLength, matchesPattern } from './utils/helpers/validators';

// Import adapters
import { notificationAdapter } from './utils/adapters/obsidian/notificationAdapter';

/**
 * Plugin settings interface
 */
interface RepositoryManagerSettings {
	author: string;
	templatesFolder: string;
	scriptsFolder: string;
	enableNotifications: boolean;
	enableAutoCapture: boolean;
}

/**
 * Default plugin settings
 */
const DEFAULT_SETTINGS: RepositoryManagerSettings = {
	author: 'Nestor',
	templatesFolder: '990-UTILIDADES/991-template',
	scriptsFolder: '990-UTILIDADES/992-script',
	enableNotifications: true,
	enableAutoCapture: true
};

/**
 * Main plugin class
 * Extends Obsidian Plugin for repository management
 */
export default class RepositoryManagerPlugin extends Plugin {
	settings: RepositoryManagerSettings;

	/**
	 * Plugin load lifecycle
	 */
	async onload() {
		// Load settings
		await this.loadSettings();

		// Register commands
		this.registerCommands();

		// Register settings tab
		this.addSettingTab(new RepositoryManagerSettingTab(this.app, this));

		console.log('Obsidian Repository Manager loaded');
	}

	/**
	 * Plugin unload lifecycle
	 */
	onunload() {
		console.log('Obsidian Repository Manager unloaded');
	}

	/**
	 * Load plugin settings
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save plugin settings
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Register plugin commands
	 */
	registerCommands() {
		// Command: Create Repository
		this.addCommand({
			id: 'repo-create-repository',
			name: 'Create Repository',
			callback: () => this.createRepository(),
			hotkeys: []
		});

		// Command: Create Task
		this.addCommand({
			id: 'repo-create-task',
			name: 'Create Task',
			callback: () => this.createTask(),
			hotkeys: []
		});

		// Command: Create Project
		this.addCommand({
			id: 'repo-create-project',
			name: 'Create Project',
			callback: () => this.createProject(),
			hotkeys: []
		});

		// Command: Create Pillar
		this.addCommand({
			id: 'repo-create-pillar',
			name: 'Create Pillar',
			callback: () => this.createPillar(),
			hotkeys: []
		});

		// Command: Create Fleeting Note
		this.addCommand({
			id: 'repo-create-fleeting-note',
			name: 'Create Fleeting Note',
			callback: () => this.createFleetingNote(),
			hotkeys: []
		});
	}

	/**
	 * Create a new repository
	 */
	async createRepository() {
		try {
			// Generate repository data
			const repositoryId = generateUniqueId({ prefix: 'repo' });
			const now = getCurrentDateTime();
			const author = this.settings.author;

			const data = {
				repositoryId,
				repositoryName: 'New Repository',
				description: 'Repository description',
				createdAt: now,
				author
			};

			// Show notification
			if (this.settings.enableNotifications) {
				new Notice(`Repository created: ${data.repositoryName}`);
			}

		} catch (error) {
			new Notice(`Error creating repository: ${error.message}`);
			console.error('Error creating repository:', error);
		}
	}

	/**
	 * Create a new task
	 */
	async createTask() {
		try {
			const taskId = generateUniqueId({ prefix: 'task' });
			new Notice(`Task created with ID: ${taskId}`);
		} catch (error) {
			new Notice(`Error creating task: ${error.message}`);
		}
	}

	/**
	 * Create a new project
	 */
	async createProject() {
		try {
			const projectId = generateUniqueId({ prefix: 'proj' });
			new Notice(`Project created with ID: ${projectId}`);
		} catch (error) {
			new Notice(`Error creating project: ${error.message}`);
		}
	}

	/**
	 * Create a new pillar
	 */
	async createPillar() {
		try {
			const pillarId = generateUniqueId({ prefix: 'pillar' });
			new Notice(`Pillar created with ID: ${pillarId}`);
		} catch (error) {
			new Notice(`Error creating pillar: ${error.message}`);
		}
	}

	/**
	 * Create a new fleeting note
	 */
	async createFleetingNote() {
		try {
			const noteId = generateUniqueId({ prefix: 'note' });
			new Notice(`Fleeting note created with ID: ${noteId}`);
		} catch (error) {
			new Notice(`Error creating fleeting note: ${error.message}`);
		}
	}
}

/**
 * Plugin settings tab
 */
class RepositoryManagerSettingTab extends PluginSettingTab {
	plugin: RepositoryManagerPlugin;

	constructor(app: App, plugin: RepositoryManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Author Name')
			.setDesc('Your name (used in metadata)')
			.addText(text => text
				.setPlaceholder('Nestor')
				.setValue(this.plugin.settings.author)
				.onChange(async (value) => {
					this.plugin.settings.author = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Templates Folder')
			.setDesc('Path to templates folder')
			.addText(text => text
				.setPlaceholder('990-UTILIDADES/991-template')
				.setValue(this.plugin.settings.templatesFolder)
				.onChange(async (value) => {
					this.plugin.settings.templatesFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Scripts Folder')
			.setDesc('Path to scripts folder')
			.addText(text => text
				.setPlaceholder('990-UTILIDADES/992-script')
				.setValue(this.plugin.settings.scriptsFolder)
				.onChange(async (value) => {
					this.plugin.settings.scriptsFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Notifications')
			.setDesc('Show notifications for actions')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableNotifications)
				.onChange(async (value) => {
					this.plugin.settings.enableNotifications = value;
					await this.plugin.saveSettings();
				}));
	}
}
