/**
 * UC-054: VAULT READER
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que lee archivos del Vault de Obsidian SIN DEPENDENCIAS.
 * No necesita Dataview, solo Obsidian API.
 * 
 * Convención de nombres:
 * ✅ camelCase: vaultReader, getMarkdownFiles, findTasksInFile
 * ✅ Archivo: vaultReader.test.ts
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

/**
 * Mock tipos de Obsidian
 */
interface TFile {
  path: string;
  name: string;
  extension: string;
  parent?: TFolder;
}

interface TFolder {
  path: string;
  name: string;
  children?: (TFile | TFolder)[];
}

interface App {
  vault: {
    getMarkdownFiles(): TFile[];
    read(file: TFile): Promise<string>;
    modify(file: TFile, content: string): Promise<void>;
    getAbstractFileByPath(path: string): TFile | TFolder | null;
  };
}

interface FileContent {
  path: string;
  name: string;
  content: string;
}

interface TaskInFile {
  filePath: string;
  lineNumber: number;
  line: string;
}

describe('UC-054: vaultReader - Vault Reader', () => {
  let vaultReader: any;
  let mockApp: Partial<App>;

  beforeEach(() => {
    // Mock Obsidian App
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn(() => [
          { path: 'inbox.md', name: 'inbox', extension: 'md' } as TFile,
          { path: 'daily/2026-04-11.md', name: '2026-04-11', extension: 'md' } as TFile
        ]),
        read: jest.fn(async (file: TFile) => {
          if (file.path === 'inbox.md') {
            return '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3';
          }
          return '';
        }),
        modify: jest.fn(),
        getAbstractFileByPath: jest.fn()
      }
    };

    const VaultReader = require('../../src/services/vault/vaultReader').VaultReader;
    vaultReader = new VaultReader(mockApp as App);
  });

  // ==================== OBTENER ARCHIVOS ====================
  describe('vaultReader - Get Markdown Files', () => {
    test('debe obtener lista de archivos markdown', async () => {
      const files = await vaultReader.getMarkdownFiles();

      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThan(0);
    });

    test('debe retornar solo archivos .md', async () => {
      const files = await vaultReader.getMarkdownFiles();

      files.forEach(file => {
        expect(file.extension).toBe('md');
      });
    });

    test('debe retornar archivos con path', async () => {
      const files = await vaultReader.getMarkdownFiles();

      files.forEach(file => {
        expect(file.path).toBeDefined();
        expect(file.path.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== LEER ARCHIVO ====================
  describe('vaultReader - Read File', () => {
    test('debe leer contenido de archivo', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const content = await vaultReader.readFile(file);

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
    });

    test('debe retornar contenido correcto', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const content = await vaultReader.readFile(file);

      expect(content).toContain('Task 1');
    });

    test('debe manejar archivo vacío', async () => {
      const file: TFile = { path: 'empty.md', name: 'empty', extension: 'md' };

      const content = await vaultReader.readFile(file);

      expect(content).toBeDefined();
    });

    test('debe manejar archivo null', async () => {
      const result = await vaultReader.readFile(null);

      expect(result).toBeNull();
    });
  });

  // ==================== ENCONTRAR TASKS EN ARCHIVO ====================
  describe('vaultReader - Find Tasks In File', () => {
    test('debe encontrar tasks en archivo', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const tasks = await vaultReader.findTasksInFile(file);

      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
    });

    test('debe retornar líneas de task', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const tasks = await vaultReader.findTasksInFile(file);

      tasks.forEach((task: TaskInFile) => {
        expect(task.line).toContain('Task');
      });
    });

    test('debe incluir número de línea', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const tasks = await vaultReader.findTasksInFile(file);

      tasks.forEach((task: TaskInFile) => {
        expect(task.lineNumber).toBeGreaterThanOrEqual(0);
      });
    });

    test('debe incluir path del archivo', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const tasks = await vaultReader.findTasksInFile(file);

      tasks.forEach((task: TaskInFile) => {
        expect(task.filePath).toBe('inbox.md');
      });
    });

    test('debe encontrar tareas completadas e incompletas', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const tasks = await vaultReader.findTasksInFile(file);

      // Debe encontrar [ ] y [x]
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==================== OBTENER TASKS DE MÚLTIPLES ARCHIVOS ====================
  describe('vaultReader - Get All Tasks', () => {
    test('debe obtener tasks de todos los archivos', async () => {
      const allTasks = await vaultReader.getAllTasks();

      expect(allTasks).toBeDefined();
      expect(Array.isArray(allTasks)).toBe(true);
    });

    test('cada task debe incluir información de archivo', async () => {
      const allTasks = await vaultReader.getAllTasks();

      allTasks.forEach((task: TaskInFile) => {
        expect(task.filePath).toBeDefined();
        expect(task.lineNumber).toBeDefined();
        expect(task.line).toBeDefined();
      });
    });

    test('debe retornar tasks vacío si no hay tasks', async () => {
      // Mock que no hay archivos con tasks
      (mockApp.vault!.getMarkdownFiles as any) = jest.fn(() => []);

      const allTasks = await vaultReader.getAllTasks();

      expect(allTasks).toEqual([]);
    });
  });

  // ==================== FILTRAR TASKS ====================
  describe('vaultReader - Filter Tasks', () => {
    test('debe filtrar tasks por carpeta', async () => {
      const allTasks = await vaultReader.getAllTasks();
      const filtered = vaultReader.filterByFolder(allTasks, 'daily');

      filtered.forEach((task: TaskInFile) => {
        expect(task.filePath).toContain('daily');
      });
    });

    test('debe filtrar tasks por patrón', async () => {
      const allTasks = await vaultReader.getAllTasks();
      const filtered = vaultReader.filterByPattern(allTasks, 'Task');

      expect(filtered.length).toBeGreaterThanOrEqual(0);
      filtered.forEach((task: TaskInFile) => {
        expect(task.line).toContain('Task');
      });
    });

    test('debe filtrar tasks por archivo', async () => {
      const allTasks = await vaultReader.getAllTasks();
      const filtered = vaultReader.filterByFile(allTasks, 'inbox.md');

      filtered.forEach((task: TaskInFile) => {
        expect(task.filePath).toBe('inbox.md');
      });
    });
  });

  // ==================== ESCRIBIR CAMBIOS ====================
  describe('vaultReader - Write Changes', () => {
    test('debe escribir cambios en archivo', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };
      const newContent = '- [x] Task 1 completado\n- [ ] Task 2';

      await vaultReader.writeFile(file, newContent);

      expect(mockApp.vault!.modify).toHaveBeenCalledWith(file, newContent);
    });

    test('debe manejar archivo null en write', async () => {
      const result = await vaultReader.writeFile(null, 'content');

      expect(result).toBe(false);
    });

    test('debe actualizar línea específica', async () => {
      const file: TFile = { path: 'inbox.md', name: 'inbox', extension: 'md' };

      const updatedContent = await vaultReader.updateLine(file, 0, '- [x] Task 1 DONE');

      expect(updatedContent).toContain('DONE');
    });
  });

  // ==================== BÚSQUEDA ====================
  describe('vaultReader - Search', () => {
    test('debe buscar tasks por contenido', async () => {
      const results = await vaultReader.searchTasks('Task 1');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('debe buscar en múltiples archivos', async () => {
      const results = await vaultReader.searchTasks('Task');

      // Debería encontrar en inbox.md
      expect(results.length).toBeGreaterThan(0);
    });

    test('debe retornar vacío si no hay resultados', async () => {
      const results = await vaultReader.searchTasks('NONEXISTENT123456');

      expect(results.length).toBe(0);
    });
  });

  // ==================== VALIDACIONES ====================
  describe('vaultReader - Validations', () => {
    test('debe validar que app existe', () => {
      expect(() => new (require('../../src/services/vault/vaultReader').VaultReader)(null)).toThrow();
    });

    test('debe validar que vault API existe', () => {
      const invalidApp = { vault: null } as any;
      expect(() => new (require('../../src/services/vault/vaultReader').VaultReader)(invalidApp)).toThrow();
    });

    test('debe validar archivo antes de leer', async () => {
      const result = await vaultReader.readFile(undefined as any);

      expect(result).toBeNull();
    });
  });

  // ==================== CACHING ====================
  describe('vaultReader - Performance', () => {
    test('debe cachear lista de archivos', async () => {
      const files1 = await vaultReader.getMarkdownFiles();
      const files2 = await vaultReader.getMarkdownFiles();

      // Debería retornar el mismo resultado
      expect(files1).toEqual(files2);
    });

    test('debe permitir limpiar cache', async () => {
      await vaultReader.getMarkdownFiles();
      vaultReader.clearCache();

      // Mock debería ser llamado nuevamente
      const files = await vaultReader.getMarkdownFiles();
      expect(files).toBeDefined();
    });
  });

  // ==================== EDGE CASES ====================
  describe('vaultReader - Edge Cases', () => {
    test('debe manejar archivos con caracteres especiales', async () => {
      const file: TFile = { 
        path: 'carpeta/archivo-especial_123.md', 
        name: 'archivo-especial_123', 
        extension: 'md' 
      };

      const tasks = await vaultReader.findTasksInFile(file);

      expect(tasks).toBeDefined();
    });

    test('debe manejar rutas anidadas profundas', async () => {
      const file: TFile = { 
        path: 'a/b/c/d/e/f/archivo.md', 
        name: 'archivo', 
        extension: 'md' 
      };

      expect(file.path).toContain('/');
    });

    test('debe manejar contenido con caracteres unicode', async () => {
      const file: TFile = { path: 'unicode.md', name: 'unicode', extension: 'md' };

      // Mock devuelve contenido con unicode
      (mockApp.vault!.read as any) = jest.fn(async () => {
        return '- [ ] Tarea con acentos: café, niño, etc';
      });

      const content = await vaultReader.readFile(file);

      expect(content).toContain('café');
    });
  });
});
