/**
 * UI Modals for user input
 * Replaces broken promptInput() and promptSelect() implementations
 * Uses Obsidian's built-in Modal and SuggestModal classes
 */

import {
  App,
  Modal,
  Setting,
  SuggestModal,
  FuzzyMatch,
  FuzzySearchString,
} from 'obsidian';

/**
 * Text input modal - Replaces broken promptInput()
 */
export class TextInputModal extends Modal {
  private resolve: (value: string | null) => void = () => {};
  private promise: Promise<string | null>;
  private inputValue: string = '';

  constructor(
    app: App,
    private title: string,
    private placeholder: string = '',
    private defaultValue: string = ''
  ) {
    super(app);
    this.inputValue = defaultValue;

    // Create a promise that resolves when modal closes
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('chronex-text-input-modal');

    // Title
    contentEl.createEl('h2', { text: this.title });

    // Input field
    let inputEl: HTMLInputElement;
    new Setting(contentEl)
      .addText((text) => {
        inputEl = text.inputEl;
        inputEl.value = this.inputValue;
        inputEl.placeholder = this.placeholder;
        inputEl.focus();

        // Allow Enter key to submit
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.submitForm();
          }
        });

        text.onChange((value) => {
          this.inputValue = value;
        });
      });

    // Buttons
    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('OK').setCta().onClick(() => {
          this.submitForm();
        })
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        })
      );
  }

  private submitForm() {
    this.resolve(this.inputValue || null);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    // Resolve with null if not already resolved (e.g., cancel button)
    this.resolve(null);
  }

  async getValue(): Promise<string | null> {
    return this.promise;
  }
}

/**
 * Option selector modal - Replaces broken promptSelect()
 * Uses SuggestModal for better UX (searchable dropdown)
 */
export class OptionSelectorModal extends SuggestModal<string> {
  private selectedValue: string | null = null;
  private promise: Promise<string>;
  private resolve: (value: string) => void = () => {};

  constructor(
    app: App,
    private title: string,
    private options: string[],
    private defaultValue: string = ''
  ) {
    super(app);
    this.setPlaceholder(`Choose an option... (default: ${defaultValue})`);

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen() {
    super.onOpen();

    // Add title to modal
    const { containerEl } = this;
    const header = containerEl.querySelector('.prompt') as HTMLElement;
    if (header) {
      header.textContent = this.title;
    }

    // Pre-select default if provided
    if (this.defaultValue) {
      this.inputEl.value = this.defaultValue;
    }
  }

  getSuggestions(inputStr: string): FuzzyMatch<string>[] {
    const lowerInput = inputStr.toLowerCase();

    return this.options
      .filter((option) => option.toLowerCase().includes(lowerInput))
      .map((option) => ({
        item: option,
        match: FuzzySearchString.fuzzySearch(inputStr, option) || {
          score: 0,
          matches: [],
        },
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }

  renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement) {
    el.setText(match.item);
  }

  onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
    this.selectedValue = item;
    this.resolve(item);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();

    // If user closed without selecting, resolve with default or first option
    if (!this.selectedValue) {
      const value = this.defaultValue || this.options[0] || '';
      this.resolve(value);
    }
  }

  async getValue(): Promise<string> {
    return this.promise;
  }
}

/**
 * Confirmation modal
 */
export class ConfirmModal extends Modal {
  private resolve: (value: boolean) => void = () => {};
  private promise: Promise<boolean>;

  constructor(
    app: App,
    private title: string,
    private message: string = ''
  ) {
    super(app);
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: this.title });

    if (this.message) {
      contentEl.createEl('p', { text: this.message });
    }

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('Yes').setCta().onClick(() => {
          this.resolve(true);
          this.close();
        })
      )
      .addButton((btn) =>
        btn.setButtonText('No').onClick(() => {
          this.resolve(false);
          this.close();
        })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.resolve(false);
  }

  async getConfirmation(): Promise<boolean> {
    return this.promise;
  }
}

/**
 * Helper functions for easier use
 */
export class UIHelper {
  static async promptText(
    app: App,
    title: string,
    placeholder: string = '',
    defaultValue: string = ''
  ): Promise<string | null> {
    const modal = new TextInputModal(app, title, placeholder, defaultValue);
    modal.open();
    return modal.getValue();
  }

  static async promptSelect(
    app: App,
    title: string,
    options: string[],
    defaultValue: string = ''
  ): Promise<string> {
    const modal = new OptionSelectorModal(app, title, options, defaultValue);
    modal.open();
    return modal.getValue();
  }

  static async confirm(
    app: App,
    title: string,
    message: string = ''
  ): Promise<boolean> {
    const modal = new ConfirmModal(app, title, message);
    modal.open();
    return modal.getConfirmation();
  }
}
