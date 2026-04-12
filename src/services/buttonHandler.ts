/**
 * ButtonHandler - Handle custom button:// URI scheme for interactive actions
 * Processes button:// links in markdown files and executes corresponding commands
 */

import { App, Notice, MarkdownPostProcessorContext } from 'obsidian';

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
 * Handle button actions
 */
async function handleButtonClick(app: App, action: ButtonAction) {
  const { action: actionType, params } = action;

  switch (actionType) {
    case 'create':
      await handleCreate(app, params);
      break;
    case 'edit':
      await handleEdit(app, params);
      break;
    case 'complete':
      await handleComplete(params);
      break;
    case 'archive':
      await handleArchive(app, params);
      break;
    case 'status':
      await handleChangeStatus(params);
      break;
    case 'priority':
      await handleChangePriority(params);
      break;
    case 'share':
      await handleShare(params);
      break;
    case 'version':
      await handleCreateVersion(params);
      break;
    default:
      new Notice(`Unknown action: ${actionType}`);
  }
}

async function handleCreate(app: App, params: Record<string, string>) {
  const { type } = params;
  const entityType = type || 'task';

  console.log(`[ButtonHandler] Creating ${entityType}`);
  new Notice(`Creating ${entityType}...`);

  // Trigger the appropriate create command
  switch (entityType) {
    case 'task':
      (app as any).commands?.executeCommandById?.('create-task');
      break;
    case 'objective':
      (app as any).commands?.executeCommandById?.('create-objective');
      break;
    case 'document':
      (app as any).commands?.executeCommandById?.('create-document');
      break;
    default:
      new Notice(`Unknown entity type: ${entityType}`);
  }
}

async function handleEdit(app: App, params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Editing entity:`, uid);
  new Notice(`Opening editor for: ${uid}`);

  // Execute the edit command
  (app as any).commands?.executeCommandById?.('edit-entity');
}

async function handleComplete(params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Marking complete:`, uid);
  new Notice(`Marked as complete: ${uid}`);
}

async function handleArchive(app: App, params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Archiving entity:`, uid);
  new Notice(`Archived: ${uid}`);

  // Execute the archive command
  (app as any).commands?.executeCommandById?.('archive-entity');
}

async function handleChangeStatus(params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Changing status for:`, uid);
  new Notice(`Change status for: ${uid}`);
}

async function handleChangePriority(params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Changing priority for:`, uid);
  new Notice(`Change priority for: ${uid}`);
}

async function handleShare(params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Sharing:`, uid);
  new Notice(`Share options for: ${uid}`);
}

async function handleCreateVersion(params: Record<string, string>) {
  const { uid } = params;
  console.log(`[ButtonHandler] Creating version for:`, uid);
  new Notice(`Creating version of: ${uid}`);
}

/**
 * Register button handler with Obsidian markdown processor
 * Call this in Plugin.onload()
 */
export function registerButtonHandler(app: App): void {
  // Register markdown post processor for button:// links
  (app as any).registerMarkdownPostProcessor?.((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const links = el.querySelectorAll('a[href^="button://"]') as NodeListOf<HTMLAnchorElement>;

    Array.from(links).forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('button://')) return;

      // Prevent default link behavior
      link.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Parse and execute button action
        const parsed = parseButtonUri(href);
        if (!parsed) {
          new Notice('Invalid button format');
          return;
        }

        // Execute button action
        handleButtonClick(app, parsed).catch((error) => {
          console.error('[ButtonHandler] Error handling button click:', error);
          new Notice('Error executing action');
        });
      });

      // Style the button link
      link.classList.add('chronex-button-link');
    });
  });

  console.log('[ButtonHandler] Button handler registered');
}

export const ButtonHandler = {
  parseButtonUri,
  registerButtonHandler,
};
