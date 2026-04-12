/**
 * ButtonHandler - Handle custom button:// URI scheme for interactive actions
 * Processes button:// links in markdown files and executes corresponding commands
 */

import { App, Notice, MarkdownPostProcessorContext, MarkdownRenderChild } from 'obsidian';

export interface ButtonAction {
  action: string;
  params: Record<string, string>;
}

/**
 * Parse button:// URI format
 * Examples:
 * - button://create?type=task&project=PROJ-202604-ABC
 * - button://edit?uid=PROJ-202604-ABC
 * - button://complete?uid=TSK-202604-XYZ
 * - button://archive?uid=OBJ-202604-ABC
 */
function parseButtonUri(uri: string): ButtonAction | null {
  try {
    const match = uri.match(/^button:\/\/([^?]+)(?:\?(.*))?$/);
    if (!match) return null;

    const action = match[1];
    const queryString = match[2] || '';
    const params: Record<string, string> = {};

    // Parse query parameters
    if (queryString) {
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }

    return { action, params };
  } catch (error) {
    console.error('[ButtonHandler] Error parsing URI:', error);
    return null;
  }
}

/**
 * Handler for button link clicks
 */
class ButtonClickHandler extends MarkdownRenderChild {
  constructor(
    private app: App,
    private containerEl: HTMLElement,
    private buttonUri: string
  ) {
    super(containerEl);
  }

  onload() {
    const parsed = parseButtonUri(this.buttonUri);
    if (!parsed) {
      console.error('[ButtonHandler] Invalid URI format:', this.buttonUri);
      return;
    }

    // Find the link element and attach click handler
    const links = this.containerEl.querySelectorAll('a');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href === this.buttonUri) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleButtonClick(parsed);
        });
        // Make it look like a button
        link.classList.add('chronex-button-link');
      }
    }
  }

  private async handleButtonClick(action: ButtonAction) {
    const { action: actionType, params } = action;

    switch (actionType) {
      case 'create':
        await this.handleCreate(params);
        break;
      case 'edit':
        await this.handleEdit(params);
        break;
      case 'complete':
        await this.handleComplete(params);
        break;
      case 'archive':
        await this.handleArchive(params);
        break;
      case 'status':
        await this.handleChangeStatus(params);
        break;
      case 'priority':
        await this.handleChangePriority(params);
        break;
      case 'share':
        await this.handleShare(params);
        break;
      case 'version':
        await this.handleCreateVersion(params);
        break;
      default:
        new Notice(`Unknown action: ${actionType}`);
    }
  }

  private async handleCreate(params: Record<string, string>) {
    const { type, parent, project } = params;
    const entityType = type || 'task';
    const parentId = parent || project;

    console.log(`[ButtonHandler] Creating ${entityType} with parent:`, parentId);
    new Notice(`Creating ${entityType}...`);

    // Trigger the appropriate create command via app.commands.executeCommandById
    switch (entityType) {
      case 'task':
        await this.app.commands.executeCommandById('create-task');
        break;
      case 'objective':
        await this.app.commands.executeCommandById('create-objective');
        break;
      case 'document':
        await this.app.commands.executeCommandById('create-document');
        break;
      default:
        new Notice(`Unknown entity type: ${entityType}`);
    }
  }

  private async handleEdit(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Editing entity:`, uid);
    new Notice(`Opening editor for: ${uid}`);

    // Execute the edit command
    await this.app.commands.executeCommandById('edit-entity');
  }

  private async handleComplete(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Marking complete:`, uid);
    new Notice(`Marked as complete: ${uid}`);

    // TODO: Implement actual status update
    // This would call TaskServiceWithVault.updateTaskWithVault() with status: 'completada'
  }

  private async handleArchive(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Archiving entity:`, uid);
    new Notice(`Archived: ${uid}`);

    // Execute the archive command
    await this.app.commands.executeCommandById('archive-entity');
  }

  private async handleChangeStatus(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Changing status for:`, uid);
    new Notice(`Change status for: ${uid}`);

    // TODO: Show status selector modal
  }

  private async handleChangePriority(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Changing priority for:`, uid);
    new Notice(`Change priority for: ${uid}`);

    // TODO: Show priority selector modal
  }

  private async handleShare(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Sharing:`, uid);
    new Notice(`Share options for: ${uid}`);

    // TODO: Implement sharing functionality
  }

  private async handleCreateVersion(params: Record<string, string>) {
    const { uid } = params;
    console.log(`[ButtonHandler] Creating version for:`, uid);
    new Notice(`Creating version of: ${uid}`);

    // TODO: Implement versioning functionality
  }
}

/**
 * Register button handler with Obsidian markdown processor
 * Call this in Plugin.onload()
 */
export function registerButtonHandler(app: App): void {
  // Register markdown post processor to handle button:// links
  app.workspace.onLayoutReady(() => {
    // Process existing markdown
    const processMarkdown = app.workspace.onLayoutReady(() => {
      // Process markdown documents that contain button:// links
      const documents = app.vault.getFiles();
      for (const file of documents) {
        if (file.extension === 'md') {
          app.vault.read(file).then((content) => {
            if (content.includes('button://')) {
              // Force rerender of the file
              const leaf = app.workspace.getActiveFile();
              if (leaf?.path === file.path) {
                app.workspace.activeLeaf?.rebuildView?.();
              }
            }
          });
        }
      }
    });
  });

  // Register markdown post processor for button:// links
  app.markdown.registerPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const links = el.querySelectorAll('a');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('button://')) {
        // Prevent default link behavior
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Parse and execute button action
          const parsed = parseButtonUri(href);
          if (!parsed) {
            new Notice('Invalid button format');
            return;
          }

          // Create handler and execute
          const handler = new ButtonClickHandler(app, link, href);
          handler.onload();
        });

        // Style the button link
        link.classList.add('chronex-button-link');
      }
    }
  });

  console.log('[ButtonHandler] Button handler registered');
}

export const ButtonHandler = {
  parseButtonUri,
  registerButtonHandler,
};
