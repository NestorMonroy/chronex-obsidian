/**
 * UC-054: vaultReader - Entry point
 */

export { VaultReader } from './vaultReader';
export type {
  TFile,
  TFolder,
  VaultAPI,
  App,
  TaskInFile,
  SearchResult,
  FileContent
} from './types';

export default {
  VaultReader: require('./vaultReader').VaultReader
};
