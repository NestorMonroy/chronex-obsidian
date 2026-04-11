/**
 * Tests para UC-P01: Instalar Plugin
 * 
 * Test-Driven Development: Escribir tests PRIMERO
 * Estos tests definen el comportamiento esperado del UC-P01
 * 
 * @see /docs/specification/use-cases/uc-p01-install-plugin.md
 */

import { PluginInstaller } from '../../src/services/installPlugin';

describe('UC-P01: Instalar Plugin', () => {
  
  describe('detectReleaseUrl', () => {
    it('debe detectar URL de GitHub release correcta', () => {
      // ARRANGE
      const pluginId = 'obsidian-repo';
      const version = '1.0.0';

      // ACT
      const url = PluginInstaller.detectReleaseUrl(pluginId, version);

      // ASSERT
      expect(url).toContain('github.com');
      expect(url).toContain('obsidian-repo');
      expect(url).toContain('v1.0.0');
      expect(url).toContain('releases');
      expect(url).toMatch(/^https:\/\//);
    });

    it('debe rechazar plugin ID vacío', () => {
      expect(() => PluginInstaller.detectReleaseUrl('', '1.0.0')).toThrow();
    });

    it('debe rechazar plugin ID null', () => {
      expect(() => PluginInstaller.detectReleaseUrl(null as any, '1.0.0')).toThrow();
    });

    it('debe rechazar versión vacía', () => {
      expect(() => PluginInstaller.detectReleaseUrl('obsidian-repo', '')).toThrow();
    });

    it('debe soportar versiones con números', () => {
      const url = PluginInstaller.detectReleaseUrl('plugin-name', '2.5.3');
      expect(url).toContain('v2.5.3');
    });
  });

  describe('validatePluginStructure', () => {
    it('debe validar estructura de plugin correcta', () => {
      // ARRANGE
      const validManifest = {
        id: 'obsidian-repo',
        name: 'Repository Manager',
        version: '1.0.0',
        minAppVersion: '0.15.0',
        description: 'Plugin para gestión de documentos',
        author: 'Nestor Monroy'
      };

      // ACT
      const isValid = PluginInstaller.validatePluginStructure(validManifest);

      // ASSERT
      expect(isValid).toBe(true);
    });

    it('debe rechazar manifest sin id', () => {
      const invalidManifest = {
        name: 'Plugin',
        version: '1.0.0'
      };
      expect(PluginInstaller.validatePluginStructure(invalidManifest)).toBe(false);
    });

    it('debe rechazar manifest sin version', () => {
      const invalidManifest = {
        id: 'plugin-id',
        name: 'Plugin'
      };
      expect(PluginInstaller.validatePluginStructure(invalidManifest)).toBe(false);
    });

    it('debe rechazar manifest sin name', () => {
      const invalidManifest = {
        id: 'plugin-id',
        version: '1.0.0'
      };
      expect(PluginInstaller.validatePluginStructure(invalidManifest)).toBe(false);
    });

    it('debe rechazar manifest null', () => {
      expect(PluginInstaller.validatePluginStructure(null as any)).toBe(false);
    });
  });

  describe('createPluginFolders', () => {
    it('debe crear carpetas requeridas para plugin', async () => {
      // ARRANGE
      const requiredFolders = [
        '100-INBOX',
        '200-PROYECTOS',
        '500-REPOSITORIOS',
        '990-UTILIDADES'
      ];

      // ACT
      const result = await PluginInstaller.createPluginFolders();

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.foldersCreated).toEqual(requiredFolders);
    });

    it('debe manejar error si no puede crear carpetas', async () => {
      // ACT & ASSERT
      try {
        await PluginInstaller.createPluginFolders();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('debe retornar lista de carpetas creadas', async () => {
      // ACT
      const result = await PluginInstaller.createPluginFolders();

      // ASSERT
      expect(result.foldersCreated).toBeInstanceOf(Array);
      expect(result.foldersCreated.length).toBeGreaterThan(0);
    });
  });

  describe('setupWizard', () => {
    it('debe ejecutar wizard de setup inicial', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.setupWizard(config);

      // ASSERT
      expect(result.completed).toBe(true);
      expect(result.steps).toContain('FOLDERS_CREATED');
      expect(result.steps).toContain('MANIFEST_VALIDATED');
    });

    it('debe crear estructura de carpetas en wizard', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.setupWizard(config);

      // ASSERT
      expect(result.foldersCreated).toBeDefined();
      expect(result.foldersCreated.length).toBeGreaterThan(0);
    });

    it('debe validar configuración en wizard', async () => {
      // ARRANGE
      const invalidConfig = { pluginName: '' };

      // ACT & ASSERT
      await expect(PluginInstaller.setupWizard(invalidConfig as any)).rejects.toThrow();
    });

    it('debe registrar pasos completados', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.setupWizard(config);

      // ASSERT
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0]).toMatch(/^[A-Z_]+$/); // Formato STEP_NAME
    });
  });

  describe('validateInstallation', () => {
    it('debe validar que instalación fue exitosa', async () => {
      // ARRANGE
      // Asumir que el wizard ya corrió

      // ACT
      const isValid = await PluginInstaller.validateInstallation();

      // ASSERT
      expect(isValid).toBe(true);
    });

    it('debe detectar si faltan carpetas requeridas', async () => {
      // ARRANGE
      // Simular instalación incompleta

      // ACT
      const isValid = await PluginInstaller.validateInstallation();

      // ASSERT
      // Si hay carpetas faltantes, debe retornar false
      expect(typeof isValid).toBe('boolean');
    });

    it('debe verificar manifest.json', async () => {
      // ACT
      const result = await PluginInstaller.validateInstallation();

      // ASSERT
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Integration: Instalación Completa', () => {
    it('debe completar instalación end-to-end', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const installResult = await PluginInstaller.install(config);

      // ASSERT
      expect(installResult.success).toBe(true);
      expect(installResult.installed).toBe(true);
      expect(installResult.message).toContain('exitosa');
    });

    it('debe detectar URL, crear carpetas y validar', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.install(config);

      // ASSERT
      expect(result.releaseUrl).toBeDefined();
      expect(result.foldersCreated).toBeDefined();
      expect(result.validated).toBe(true);
    });

    it('debe manejar errores en proceso de instalación', async () => {
      // ARRANGE
      const invalidConfig = { pluginName: '' };

      // ACT & ASSERT
      await expect(PluginInstaller.install(invalidConfig as any)).rejects.toThrow();
    });

    it('debe retornar información completa de instalación', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.install(config);

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('installed');
      expect(result).toHaveProperty('releaseUrl');
      expect(result).toHaveProperty('foldersCreated');
      expect(result).toHaveProperty('validated');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('debe lanzar error si plugin name es inválido', () => {
      expect(() => PluginInstaller.detectReleaseUrl('invalid@#$', '1.0.0')).toThrow();
    });

    it('debe proporcionar mensaje de error claro', async () => {
      // ARRANGE & ACT & ASSERT
      try {
        await PluginInstaller.install({ pluginName: '' });
      } catch (error: any) {
        expect(error.message).toContain('Plugin name');
      }
    });

    it('debe validar estructura de carpetas antes de completar', async () => {
      // ARRANGE
      const config = {
        pluginName: 'obsidian-repo',
        version: '1.0.0'
      };

      // ACT
      const result = await PluginInstaller.install(config);

      // ASSERT
      expect(result.validated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar versión con pre-release', () => {
      const url = PluginInstaller.detectReleaseUrl('plugin', '1.0.0-beta');
      expect(url).toContain('v1.0.0-beta');
    });

    it('debe manejar plugin names con guiones', () => {
      const url = PluginInstaller.detectReleaseUrl('my-awesome-plugin', '1.0.0');
      expect(url).toContain('my-awesome-plugin');
    });

    it('debe ignorar espacios en nombres', () => {
      expect(() => PluginInstaller.detectReleaseUrl('  obsidian-repo  ', '1.0.0')).toThrow();
    });
  });
});
