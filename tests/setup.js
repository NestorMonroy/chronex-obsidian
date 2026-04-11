/**
 * Jest Setup - Configuración inicial para tests
 */

// Mocks simples sin dependencias
global.app = {
  vault: {
    createFolder: () => Promise.resolve(undefined),
    createFile: () => Promise.resolve(undefined),
    getAbstractFileByPath: () => null,
    read: () => Promise.resolve('')
  },
  metadataCache: {
    getCache: () => ({}),
    getFileCache: () => null
  }
};

global.quickAddApi = {
  inputPrompt: () => Promise.resolve(''),
  wideInputPrompt: () => Promise.resolve(''),
  suggester: () => Promise.resolve(''),
  yesNoPrompt: () => Promise.resolve(false)
};
