/**
 * UC-056: VAULTWRITER + BUTTON INTEGRATION
 * 
 * TDD RED - TESTS FIRST (ESPECIFICACIÓN)
 * 
 * 45+ tests que especifican exactamente qué debe hacer cada componente
 * 
 * Convención: camelCase, tests sin sufijos
 * Patrón: describe → test → expect
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { TFile, Vault } from 'obsidian';

/**
 * MOCK TIPOS
 */
interface MockFile {
  path: string;
  name: string;
  content: string;
}

interface WriteOptions {
  backup?: boolean;
  overwrite?: boolean;
  createIfNotExists?: boolean;
  validateBefore?: boolean;
}

interface UpdateOptions {
  preserveFrontmatter?: boolean;
  mergeFields?: boolean;
  backup?: boolean;
}

interface ButtonConfig {
  name: string;
  action: string;
  uid?: string;
  params?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE 1: VAULTWRITER TESTS (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('UC-056: VaultWriter - Escribir archivos en Vault', () => {
  let vaultWriter: any;
  let mockVault: any;

  beforeEach(() => {
    const VaultWriter = require('../../src/services/vaultWriter').VaultWriter;
    mockVault = {
      create: jest.fn(),
      modify: jest.fn(),
      read: jest.fn(),
      getAbstractFileByPath: jest.fn()
    };
    vaultWriter = new VaultWriter(mockVault);
  });

  // ==================== ESCRIBIR ARCHIVOS ====================
  describe('VaultWriter - Write Files', () => {
    test('debe escribir archivo nuevo en path válido', async () => {
      const content = '# Mi Archivo\n\nContenido de prueba';
      const path = 'test/archivo.md';

      const result = await vaultWriter.writeFile(path, content);

      expect(result.success).toBe(true);
      expect(result.path).toBe(path);
      expect(mockVault.create).toHaveBeenCalledWith(
        path,
        expect.stringContaining('Mi Archivo')
      );
    });

    test('debe rechazar write si path es inválido', async () => {
      const result = await vaultWriter.writeFile('', 'contenido');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe crear backup antes de escribir si option lo pide', async () => {
      const path = 'test/archivo.md';
      const options: WriteOptions = { backup: true };

      await vaultWriter.writeFile(path, 'contenido', options);

      expect(vaultWriter.createBackup).toHaveBeenCalledWith(path);
    });

    test('debe sobrescribir archivo si overwrite=true', async () => {
      const path = 'test/archivo.md';
      const options: WriteOptions = { overwrite: true };
      mockVault.getAbstractFileByPath.mockReturnValue({ path });

      const result = await vaultWriter.writeFile(path, 'nuevo contenido', options);

      expect(result.success).toBe(true);
    });

    test('debe rechazar sobrescribir si overwrite=false', async () => {
      const path = 'test/archivo.md';
      const options: WriteOptions = { overwrite: false };
      mockVault.getAbstractFileByPath.mockReturnValue({ path });

      const result = await vaultWriter.writeFile(path, 'contenido', options);

      expect(result.success).toBe(false);
    });

    test('debe crear carpeta si no existe y createIfNotExists=true', async () => {
      const path = 'nueva-carpeta/archivo.md';
      const options: WriteOptions = { createIfNotExists: true };

      await vaultWriter.writeFile(path, 'contenido', options);

      expect(result.success).toBe(true);
    });

    test('debe validar contenido antes de escribir si validateBefore=true', async () => {
      const options: WriteOptions = { validateBefore: true };
      const invalidContent = '---\ninvalid yaml';

      const result = await vaultWriter.writeFile('test.md', invalidContent, options);

      expect(result.success).toBe(false);
    });

    test('debe normalizar contenido markdown', async () => {
      const content = '# Heading\n\n\n\nMucho espacio\n\n\nTexto';

      await vaultWriter.writeFile('test.md', content);

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).not.toContain('\n\n\n');
    });
  });

  // ==================== ACTUALIZAR ARCHIVOS ====================
  describe('VaultWriter - Update Files', () => {
    test('debe actualizar archivo existente', async () => {
      const path = 'test/archivo.md';
      const newContent = '# Contenido actualizado';
      mockVault.getAbstractFileByPath.mockReturnValue({ path });

      const result = await vaultWriter.updateFile(path, newContent);

      expect(result.success).toBe(true);
      expect(mockVault.modify).toHaveBeenCalled();
    });

    test('debe rechazar update si archivo no existe', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const result = await vaultWriter.updateFile('inexistente.md', 'contenido');

      expect(result.success).toBe(false);
    });

    test('debe preservar frontmatter existente en update', async () => {
      const oldContent = '---\nUID: task-123\nstatus: TODO\n---\n# Viejo contenido';
      const newContent = '# Nuevo contenido';
      const path = 'test.md';
      mockVault.read.mockReturnValue(oldContent);

      await vaultWriter.updateContent(path, newContent);

      const updatedContent = mockVault.modify.mock.calls[0][1];
      expect(updatedContent).toContain('UID: task-123');
      expect(updatedContent).toContain('status: TODO');
      expect(updatedContent).toContain('# Nuevo contenido');
    });

    test('debe actualizar campo específico del frontmatter', async () => {
      const path = 'test.md';
      const oldContent = '---\nUID: task-123\nstatus: TODO\n---\n# Contenido';

      await vaultWriter.updateFrontmatterField(path, 'status', 'DONE');

      const updated = mockVault.modify.mock.calls[0][1];
      expect(updated).toContain('status: DONE');
      expect(updated).toContain('# Contenido');
    });

    test('debe mergear fields nuevos sin perder existentes', async () => {
      const path = 'test.md';
      const oldFm = { UID: 'task-123', status: 'TODO' };
      const newFields = { dateCompleted: '2026-04-11' };

      await vaultWriter.updateFrontmatterField(path, 'dateCompleted', '2026-04-11');

      const updated = mockVault.modify.mock.calls[0][1];
      expect(updated).toContain('UID: task-123');
      expect(updated).toContain('dateCompleted: 2026-04-11');
    });
  });

  // ==================== BACKUP Y RESTORE ====================
  describe('VaultWriter - Backup Operations', () => {
    test('debe crear backup antes de escribir', async () => {
      const path = 'test.md';

      const backupPath = await vaultWriter.createBackup(path);

      expect(backupPath).toBeDefined();
      expect(backupPath).toContain('backup');
      expect(backupPath).toContain(path);
    });

    test('debe restaurar desde backup', async () => {
      const path = 'test.md';
      const backupPath = 'test.md.backup.2026-04-11';

      const result = await vaultWriter.restoreFromBackup(path, backupPath);

      expect(result).toBe(true);
    });

    test('debe rechazar restore si backup no existe', async () => {
      const result = await vaultWriter.restoreFromBackup('test.md', 'inexistente.backup');

      expect(result).toBe(false);
    });

    test('debe limpiar backups antiguos', async () => {
      const path = 'test.md';
      await vaultWriter.createBackup(path);
      await vaultWriter.createBackup(path);
      await vaultWriter.createBackup(path);

      // Debe mantener solo últimos N backups
      const backups = await vaultWriter.listBackups(path);
      expect(backups.length).toBeLessThanOrEqual(5);
    });
  });

  // ==================== VALIDACIONES ====================
  describe('VaultWriter - Validations', () => {
    test('debe validar path antes de escribir', async () => {
      const invalidPaths = ['', '/', '\\', null, undefined, '../etc/passwd'];

      for (const path of invalidPaths) {
        const result = await vaultWriter.writeFile(path, 'contenido');
        expect(result.success).toBe(false);
      }
    });

    test('debe validar contenido markdown válido', () => {
      const validContent = '# Heading\n\nPárrafo';
      const result = vaultWriter.validateMarkdown(validContent);

      expect(result.valid).toBe(true);
    });

    test('debe validar estructura markdown', () => {
      const invalidContent = '# Heading sin cierre\n##  Sin contenido';
      const result = vaultWriter.validateMarkdown(invalidContent);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('debe validar UTF-8 encoding', async () => {
      const content = 'Contenido con acentuación: café, niño, España';

      const result = await vaultWriter.writeFile('test.md', content);

      expect(result.success).toBe(true);
    });
  });

  // ==================== CASOS EDGE ====================
  describe('VaultWriter - Edge Cases', () => {
    test('debe manejar archivos muy grandes', async () => {
      const largeContent = 'x'.repeat(5000000); // 5MB

      const result = await vaultWriter.writeFile('large.md', largeContent);

      expect(result.success).toBe(true);
    });

    test('debe manejar caracteres especiales en paths', async () => {
      const path = 'folder/archivo con espacios & caracteres.md';

      const result = await vaultWriter.writeFile(path, 'contenido');

      expect(result.success).toBe(true);
    });

    test('debe ser atómico - todo o nada', async () => {
      const path = 'test.md';
      mockVault.modify.mockRejectedValueOnce(new Error('Disk full'));

      const result = await vaultWriter.updateFile(path, 'contenido');

      expect(result.success).toBe(false);
      // Backup debe estar intacto
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE 2: BUTTONWRITER TESTS (15 tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('UC-056: ButtonWriter - Insertar botones en archivos', () => {
  let buttonWriter: any;
  let mockFile: MockFile;

  beforeEach(() => {
    const ButtonWriter = require('../../src/services/vaultWriter').ButtonWriter;
    buttonWriter = new ButtonWriter();
    mockFile = {
      path: 'test/task.md',
      name: 'task.md',
      content: '# Mi Tarea\n\nContenido'
    };
  });

  // ==================== INSERTAR BOTONES ====================
  describe('ButtonWriter - Insert Buttons', () => {
    test('debe insertar botón en markdown', () => {
      const button: ButtonConfig = {
        name: 'Completar',
        action: 'complete',
        uid: 'task-123'
      };

      const result = buttonWriter.insertButton(mockFile, 0, button);

      expect(result).toContain('[✅ Completar](button://complete?uid=task-123)');
    });

    test('debe renderizar botón con parámetros', () => {
      const button: ButtonConfig = {
        name: 'Completar',
        action: 'complete',
        uid: 'task-123',
        params: { date: '2026-04-11' }
      };

      const rendered = buttonWriter.renderButton(button);

      expect(rendered).toContain('button://complete');
      expect(rendered).toContain('uid=task-123');
      expect(rendered).toContain('date=2026-04-11');
    });

    test('debe insertar múltiples botones', () => {
      const buttons = [
        { name: 'Editar', action: 'edit', uid: 'task-123' },
        { name: 'Completar', action: 'complete', uid: 'task-123' },
        { name: 'Eliminar', action: 'delete', uid: 'task-123' }
      ];

      let content = mockFile.content;
      for (const button of buttons) {
        content = buttonWriter.insertButton({ ...mockFile, content }, 0, button);
      }

      expect(content).toContain('button://edit');
      expect(content).toContain('button://complete');
      expect(content).toContain('button://delete');
    });

    test('debe evitar botones duplicados', () => {
      const button: ButtonConfig = {
        name: 'Completar',
        action: 'complete',
        uid: 'task-123'
      };

      let content = mockFile.content;
      content = buttonWriter.insertButton({ ...mockFile, content }, 0, button);
      content = buttonWriter.insertButton({ ...mockFile, content }, 0, button);

      const count = (content.match(/button:\/\/complete/g) || []).length;
      expect(count).toBe(1);
    });

    test('debe insertar botón en posición específica', () => {
      const button: ButtonConfig = {
        name: 'Test',
        action: 'test'
      };

      const content = mockFile.content.split('\n');
      const result = buttonWriter.insertButton(mockFile, 1, button);

      // Botón debe estar cerca de la segunda línea
      expect(result).toBeDefined();
    });
  });

  // ==================== PARSEAR Y VALIDAR ====================
  describe('ButtonWriter - Parse and Validate', () => {
    test('debe parsear configuración de botón', () => {
      const config = 'name: Completar\naction: complete\nuid: task-123';

      const parsed = buttonWriter.parseButtonConfig(config);

      expect(parsed.name).toBe('Completar');
      expect(parsed.action).toBe('complete');
      expect(parsed.uid).toBe('task-123');
    });

    test('debe validar parámetros requeridos', () => {
      const invalidButton = {
        name: 'Sin Acción',
        action: undefined
      };

      const result = buttonWriter.validateButton(invalidButton);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('action es requerido');
    });

    test('debe validar valores de enumeración', () => {
      const button = {
        name: 'Test',
        action: 'accion-invalida'
      };

      const result = buttonWriter.validateButton(button);

      expect(result.valid).toBe(false);
    });

    test('debe validar UIDs válidos', () => {
      const button = {
        name: 'Test',
        action: 'complete',
        uid: 'uid-invalido-!!!!'
      };

      const result = buttonWriter.validateButton(button);

      expect(result.valid).toBe(false);
    });

    test('debe validar links markdown', () => {
      const button = {
        name: 'Test',
        action: 'open',
        params: { link: 'archivo-invalido.md' }
      };

      const result = buttonWriter.validateButton(button);

      expect(result.valid).toBe(false);
    });
  });

  // ==================== REMOVER Y ACTUALIZAR ====================
  describe('ButtonWriter - Remove and Update', () => {
    test('debe remover botón por ID', () => {
      const content = '[✅ Test](button://test?id=btn-1)\n# Contenido';

      const result = buttonWriter.removeButton(content, 'btn-1');

      expect(result).not.toContain('button://test');
      expect(result).toContain('# Contenido');
    });

    test('debe actualizar parámetros de botón', () => {
      const content = '[✅ Priority](button://priority?uid=task-123&value=MEDIA)';

      const updated = buttonWriter.updateButtonParams(
        content,
        'priority',
        { value: 'ALTA' }
      );

      expect(updated).toContain('value=ALTA');
      expect(updated).not.toContain('value=MEDIA');
    });

    test('debe mantener estructura al remover botón', () => {
      const content = '# Título\n\n[🔘 Botón](button://test)\n\n## Sección\n\nTexto';

      const result = buttonWriter.removeButton(content, 'test');

      expect(result).toContain('# Título');
      expect(result).toContain('## Sección');
      expect(result).toContain('Texto');
    });
  });

  // ==================== BOTONES PREDEFINIDOS ====================
  describe('ButtonWriter - Predefined Buttons', () => {
    test('debe crear botón Complete', () => {
      const button = buttonWriter.createCompleteButton('task-123');

      expect(button.action).toBe('complete');
      expect(button.uid).toBe('task-123');
      expect(button.name).toContain('Completar');
    });

    test('debe crear botón Edit', () => {
      const button = buttonWriter.createEditButton('task-123');

      expect(button.action).toBe('edit');
      expect(button.uid).toBe('task-123');
    });

    test('debe crear botón Delete', () => {
      const button = buttonWriter.createDeleteButton('task-123');

      expect(button.action).toBe('delete');
      expect(button.uid).toBe('task-123');
    });

    test('debe crear botón Priority', () => {
      const button = buttonWriter.createPriorityButton('task-123', 'ALTA');

      expect(button.action).toBe('priority');
      expect(button.params.value).toBe('ALTA');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE 3: FRONTMATTERMANAGER TESTS (10 tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('UC-056: FrontmatterManager - Gestionar YAML frontmatter', () => {
  let fmManager: any;

  beforeEach(() => {
    const FrontmatterManager = require('../../src/services/vaultWriter').FrontmatterManager;
    fmManager = new FrontmatterManager();
  });

  // ==================== PARSEAR FRONTMATTER ====================
  describe('FrontmatterManager - Parse', () => {
    test('debe parsear frontmatter YAML válido', () => {
      const content = '---\nUID: task-123\nstatus: TODO\n---\n# Contenido';

      const { frontmatter, body } = fmManager.parseFrontmatter(content);

      expect(frontmatter.UID).toBe('task-123');
      expect(frontmatter.status).toBe('TODO');
      expect(body).toContain('# Contenido');
    });

    test('debe manejar frontmatter vacío', () => {
      const content = '---\n---\n# Contenido';

      const { frontmatter, body } = fmManager.parseFrontmatter(content);

      expect(Object.keys(frontmatter).length).toBe(0);
      expect(body).toContain('# Contenido');
    });

    test('debe manejar contenido sin frontmatter', () => {
      const content = '# Contenido sin frontmatter';

      const { frontmatter, body } = fmManager.parseFrontmatter(content);

      expect(Object.keys(frontmatter).length).toBe(0);
      expect(body).toBe(content);
    });

    test('debe parsear arrays en YAML', () => {
      const content = '---\ntags:\n  - trabajo\n  - urgente\n---\n# Titulo';

      const { frontmatter } = fmManager.parseFrontmatter(content);

      expect(Array.isArray(frontmatter.tags)).toBe(true);
      expect(frontmatter.tags).toContain('trabajo');
    });

    test('debe parsear valores especiales (null, boolean)', () => {
      const content = '---\nisdone: true\nempty: null\n---\n# Titulo';

      const { frontmatter } = fmManager.parseFrontmatter(content);

      expect(frontmatter.isdone).toBe(true);
      expect(frontmatter.empty).toBe(null);
    });
  });

  // ==================== ACTUALIZAR FRONTMATTER ====================
  describe('FrontmatterManager - Update', () => {
    test('debe actualizar field específico', () => {
      const fm = { UID: 'task-123', status: 'TODO', priority: 'MEDIA' };

      const updated = fmManager.updateField(fm, 'status', 'DONE');

      expect(updated.status).toBe('DONE');
      expect(updated.UID).toBe('task-123');
      expect(updated.priority).toBe('MEDIA');
    });

    test('debe agregar field nuevo', () => {
      const fm = { UID: 'task-123' };

      const updated = fmManager.updateField(fm, 'dateCompleted', '2026-04-11');

      expect(updated.dateCompleted).toBe('2026-04-11');
      expect(updated.UID).toBe('task-123');
    });

    test('debe validar schema', () => {
      const fm = { UID: 'task-123', status: 'TODO' };
      const schema = {
        fields: {
          UID: { type: 'string', required: true },
          status: { type: 'enum', enum: ['TODO', 'DONE'], required: true }
        },
        required: ['UID', 'status']
      };

      const result = fmManager.validateSchema(fm, schema);

      expect(result.valid).toBe(true);
    });

    test('debe detectar campos requeridos faltantes', () => {
      const fm = { UID: 'task-123' };
      const schema = {
        fields: {
          UID: { type: 'string', required: true },
          status: { type: 'string', required: true }
        },
        required: ['UID', 'status']
      };

      const result = fmManager.validateSchema(fm, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('status es requerido');
    });

    test('debe mergear dos frontmatters', () => {
      const existing = { UID: 'task-123', status: 'TODO' };
      const updates = { status: 'DONE', dateCompleted: '2026-04-11' };

      const merged = fmManager.mergeFrontmatter(existing, updates);

      expect(merged.UID).toBe('task-123');
      expect(merged.status).toBe('DONE');
      expect(merged.dateCompleted).toBe('2026-04-11');
    });

    test('debe serializar frontmatter a YAML válido', () => {
      const fm = {
        UID: 'task-123',
        status: 'TODO',
        tags: ['trabajo', 'urgente'],
        priority: 'ALTA'
      };

      const yaml = fmManager.serializeToYAML(fm);

      expect(yaml).toContain('UID: task-123');
      expect(yaml).toContain('status: TODO');
      expect(yaml).toContain('- trabajo');
      expect(yaml).toContain('- urgente');
    });

    test('debe manejar caracteres especiales en YAML', () => {
      const fm = {
        title: 'Tarea con "comillas" y \'apóstrofes\'',
        description: 'Línea 1\nLínea 2'
      };

      const yaml = fmManager.serializeToYAML(fm);
      const parsed = fmManager.parseFrontmatter(`---\n${yaml}\n---\n`);

      expect(parsed.frontmatter.title).toBe(fm.title);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RESUMEN TESTS UC-056:
 * 
 * VaultWriter (20 tests):
 *   ✓ Write files (7 tests)
 *   ✓ Update files (6 tests)
 *   ✓ Backup operations (4 tests)
 *   ✓ Validations (4 tests)
 *   ✓ Edge cases (3 tests)
 * 
 * ButtonWriter (15 tests):
 *   ✓ Insert buttons (5 tests)
 *   ✓ Parse and validate (5 tests)
 *   ✓ Remove and update (3 tests)
 *   ✓ Predefined buttons (4 tests)
 * 
 * FrontmatterManager (10 tests):
 *   ✓ Parse (5 tests)
 *   ✓ Update and validate (5 tests)
 * 
 * TOTAL: 45+ TESTS
 * 
 * ESTADO: RED (Tests especifican, código NO EXISTE AÚN)
 * 
 * PRÓXIMO: TDD GREEN - Implementar código
 */
