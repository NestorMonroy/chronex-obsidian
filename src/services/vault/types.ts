/**
 * UC-054: Types e Interfaces - Vault Reader
 */

export interface TFile {
  path: string;
  name: string;
  extension: string;
  parent?: TFolder;
}

export interface TFolder {
  path: string;
  name: string;
  children?: (TFile | TFolder)[];
}

export interface VaultAPI {
  getMarkdownFiles(): TFile[];
  read(file: TFile): Promise<string>;
  modify(file: TFile, content: string): Promise<void>;
  getAbstractFileByPath(path: string): TFile | TFolder | null;
}

export interface App {
  vault: VaultAPI;
}

export interface TaskInFile {
  filePath: string;
  fileName: string;
  lineNumber: number;
  line: string;
}

export interface SearchResult {
  filePath: string;
  fileName: string;
  results: TaskInFile[];
}

export interface FileContent {
  path: string;
  content: string;
}

export default {
  TFile,
  TFolder,
  VaultAPI,
  App,
  TaskInFile,
  SearchResult,
  FileContent
};
