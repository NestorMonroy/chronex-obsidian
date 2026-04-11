/**
 * UC-056: TYPES - Tipos e Interfaces
 * 
 * Define todas las interfaces y tipos para los componentes de UC-056
 */

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT WRITER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WriteOptions {
  backup?: boolean;
  overwrite?: boolean;
  createIfNotExists?: boolean;
  validateBefore?: boolean;
}

export interface UpdateOptions {
  preserveFrontmatter?: boolean;
  mergeFields?: boolean;
  backup?: boolean;
}

export interface WriteResult {
  success: boolean;
  path: string;
  backupPath?: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  path: string;
  changes: number;
  error?: string;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: string;
  size: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON WRITER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ButtonConfig {
  name: string;
  action: string;
  uid?: string;
  params?: Record<string, string>;
  icon?: string;
  emoji?: string;
  color?: string;
}

export interface RenderedButton {
  markdown: string;
  html: string;
  isValid: boolean;
}

export interface ButtonValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRONTMATTER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FrontmatterData {
  [key: string]: any;
}

export interface ParsedContent {
  frontmatter: FrontmatterData;
  body: string;
}

export interface FrontmatterSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'array';
    required?: boolean;
    default?: any;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON REGISTRY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ButtonRegistryEntry {
  id: string;
  name: string;
  emoji: string;
  color: string;
  action: string;
  category: string;
  description?: string;
  appearances: string[];
}

export interface ButtonRegistry {
  buttons: Map<string, ButtonRegistryEntry>;
  categories: string[];
}

export interface ButtonRegistryOptions {
  filePath: string;
  cache?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON RESOLVER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DetectedReference {
  id: string;
  raw: string;
  position: {
    start: number;
    end: number;
  };
}

export interface ResolvedButton {
  id: string;
  config: ButtonRegistryEntry;
  svg: string;
  markdown: string;
}

export interface ResolveOptions {
  injectSvg?: boolean;
  maintainStructure?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPATIBILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AdmonitionStructure {
  type: 'ad-flex' | 'ad-blank';
  content: string;
  nested?: AdmonitionStructure[];
}

export interface StructurePreservation {
  preserved: boolean;
  structure: AdmonitionStructure[];
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export class VaultWriterError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'VaultWriterError';
  }
}

export class ButtonValidationError extends Error {
  constructor(message: string, public buttonId?: string) {
    super(message);
    this.name = 'ButtonValidationError';
  }
}

export class RegistryError extends Error {
  constructor(message: string, public registryPath?: string) {
    super(message);
    this.name = 'RegistryError';
  }
}
