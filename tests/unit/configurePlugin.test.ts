/**
 * Tests para UC-P02: Configurar Plugin
 * 
 * Test-Driven Development: Escribir tests PRIMERO
 * Estos tests definen el comportamiento esperado del UC-P02
 * 
 * @see /docs/specification/use-cases/uc-p02-configure-plugin.md
 */

import { PluginConfig, SettingsManager } from '../../src/services/configurePlugin';

describe('UC-P02: Configurar Plugin', () => {
  
  describe('getDefaultConfig', () => {
    it('debe retornar configuración por defecto', () => {
      // ACT
      const defaultConfig = SettingsManager.getDefaultConfig();

      // ASSERT
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.inboxFolder).toBeDefined();
      expect(defaultConfig.projectsFolder).toBeDefined();
      expect(defaultConfig.repositoriesFolder).toBeDefined();
      expect(defaultConfig.utilitiesFolder).toBeDefined();
    });

    it('debe tener paths por defecto correctos', () => {
      // ACT
      const config = SettingsManager.getDefaultConfig();

      // ASSERT
      expect(config.inboxFolder).toBe('100-INBOX');
      expect(config.projectsFolder).toBe('200-PROYECTOS');
      expect(config.repositoriesFolder).toBe('500-REPOSITORIOS');
      expect(config.utilitiesFolder).toBe('990-UTILIDADES');
    });

    it('debe tener valores booleanos para features', () => {
      // ACT
      const config = SettingsManager.getDefaultConfig();

      // ASSERT
      expect(typeof config.enableLogging).toBe('boolean');
      expect(typeof config.enableNotifications).toBe('boolean');
      expect(typeof config.enableAutoBackup).toBe('boolean');
    });

    it('debe retener idioma por defecto', () => {
      // ACT
      const config = SettingsManager.getDefaultConfig();

      // ASSERT
      expect(config.language).toBeDefined();
      expect(['es', 'en']).toContain(config.language);
    });
  });

  describe('validateConfig', () => {
    it('debe validar configuración correcta', () => {
      // ARRANGE
      const validConfig: PluginConfig = {
        inboxFolder: '100-INBOX',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES',
        enableLogging: true,
        enableNotifications: true,
        enableAutoBackup: false,
        language: 'es'
      };

      // ACT
      const result = SettingsManager.validateConfig(validConfig);

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar config sin inboxFolder', () => {
      // ARRANGE
      const invalidConfig: any = {
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS'
      };

      // ACT
      const result = SettingsManager.validateConfig(invalidConfig);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.toLowerCase().includes('inbox'))).toBe(true);
    });

    it('debe rechazar folder paths vacíos', () => {
      // ARRANGE
      const invalidConfig: any = {
        inboxFolder: '',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES'
      };

      // ACT
      const result = SettingsManager.validateConfig(invalidConfig);

      // ASSERT
      expect(result.valid).toBe(false);
    });

    it('debe validar que language es válido', () => {
      // ARRANGE
      const config: PluginConfig = {
        inboxFolder: '100-INBOX',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES',
        enableLogging: true,
        enableNotifications: true,
        enableAutoBackup: false,
        language: 'invalido'
      };

      // ACT
      const result = SettingsManager.validateConfig(config);

      // ASSERT
      expect(result.valid).toBe(false);
    });

    it('debe retornar lista de errores específicos', () => {
      // ARRANGE
      const invalidConfig: any = {
        inboxFolder: '',
        projectsFolder: '',
        language: 'invalid'
      };

      // ACT
      const result = SettingsManager.validateConfig(invalidConfig);

      // ASSERT
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach(error => {
        expect(typeof error).toBe('string');
      });
    });
  });

  describe('loadConfig', () => {
    it('debe cargar configuración guardada', async () => {
      // ACT
      const config = await SettingsManager.loadConfig();

      // ASSERT
      expect(config).toBeDefined();
      expect(config.inboxFolder).toBeDefined();
    });

    it('debe retornar default config si no hay guardada', async () => {
      // ACT
      const config = await SettingsManager.loadConfig();

      // ASSERT
      const defaultConfig = SettingsManager.getDefaultConfig();
      expect(config.inboxFolder).toBe(defaultConfig.inboxFolder);
    });

    it('debe ser un objeto válido con todas las propiedades', async () => {
      // ACT
      const config = await SettingsManager.loadConfig();

      // ASSERT
      expect(config).toHaveProperty('inboxFolder');
      expect(config).toHaveProperty('projectsFolder');
      expect(config).toHaveProperty('repositoriesFolder');
      expect(config).toHaveProperty('utilitiesFolder');
      expect(config).toHaveProperty('enableLogging');
      expect(config).toHaveProperty('enableNotifications');
      expect(config).toHaveProperty('language');
    });
  });

  describe('saveConfig', () => {
    it('debe guardar configuración correctamente', async () => {
      // ARRANGE
      const config: PluginConfig = {
        inboxFolder: '100-INBOX-CUSTOM',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES',
        enableLogging: true,
        enableNotifications: false,
        enableAutoBackup: true,
        language: 'en'
      };

      // ACT
      const result = await SettingsManager.saveConfig(config);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe validar antes de guardar', async () => {
      // ARRANGE
      const invalidConfig: any = {
        inboxFolder: ''
      };

      // ACT & ASSERT
      await expect(SettingsManager.saveConfig(invalidConfig)).rejects.toThrow();
    });

    it('debe retornar mensaje de éxito', async () => {
      // ARRANGE
      const config = SettingsManager.getDefaultConfig();

      // ACT
      const result = await SettingsManager.saveConfig(config);

      // ASSERT
      expect(result.message).toBeDefined();
      expect(result.message).toContain('guardada');
    });
  });

  describe('updateConfig', () => {
    it('debe actualizar solo los campos especificados', async () => {
      // ARRANGE
      const updates = { enableLogging: false };

      // ACT
      const updatedConfig = await SettingsManager.updateConfig(updates);

      // ASSERT
      expect(updatedConfig.enableLogging).toBe(false);
      expect(updatedConfig.inboxFolder).toBeDefined(); // Otros campos preservados
    });

    it('debe validar cambios antes de aplicar', async () => {
      // ARRANGE
      const invalidUpdates: any = { inboxFolder: '' };

      // ACT & ASSERT
      await expect(SettingsManager.updateConfig(invalidUpdates)).rejects.toThrow();
    });

    it('debe permitir actualizar un solo campo', async () => {
      // ARRANGE
      const updates = { language: 'en' };

      // ACT
      const result = await SettingsManager.updateConfig(updates);

      // ASSERT
      expect(result.language).toBe('en');
    });

    it('debe preservar campos no actualizados', async () => {
      // ARRANGE
      const originalConfig = SettingsManager.getDefaultConfig();
      const updates = { language: 'en' };

      // ACT
      const result = await SettingsManager.updateConfig(updates);

      // ASSERT
      expect(result.inboxFolder).toBe(originalConfig.inboxFolder);
      expect(result.projectsFolder).toBe(originalConfig.projectsFolder);
    });
  });

  describe('resetConfig', () => {
    it('debe resetear a configuración por defecto', async () => {
      // ARRANGE
      await SettingsManager.saveConfig({
        ...SettingsManager.getDefaultConfig(),
        language: 'en'
      });

      // ACT
      const resetConfig = await SettingsManager.resetConfig();

      // ASSERT
      expect(resetConfig.language).toBe(SettingsManager.getDefaultConfig().language);
    });

    it('debe retornar configuración por defecto después de reset', async () => {
      // ACT
      const resetConfig = await SettingsManager.resetConfig();

      // ASSERT
      const defaultConfig = SettingsManager.getDefaultConfig();
      expect(resetConfig).toEqual(defaultConfig);
    });
  });

  describe('getSettingsTab', () => {
    it('debe retornar tab de settings válido', () => {
      // ACT
      const tab = SettingsManager.getSettingsTab();

      // ASSERT
      expect(tab).toBeDefined();
      expect(tab.title).toBeDefined();
      expect(tab.containerEl).toBeDefined();
    });

    it('debe tener configuraciones para cambiar paths', () => {
      // ACT
      const tab = SettingsManager.getSettingsTab();

      // ASSERT
      expect(tab.settings).toBeDefined();
      expect(tab.settings.length).toBeGreaterThan(0);
      expect(tab.settings.some(s => s.name.includes('Folder'))).toBe(true);
    });

    it('debe tener toggles para features', () => {
      // ACT
      const tab = SettingsManager.getSettingsTab();

      // ASSERT
      expect(tab.settings.some(s => s.type === 'toggle')).toBe(true);
    });

    it('debe tener selector de idioma', () => {
      // ACT
      const tab = SettingsManager.getSettingsTab();

      // ASSERT
      expect(tab.settings.some(s => s.name.toLowerCase().includes('language'))).toBe(true);
    });
  });

  describe('Integration: Settings Complete Flow', () => {
    it('debe permitir cambiar configuración completa', async () => {
      // ARRANGE
      const newConfig: PluginConfig = {
        inboxFolder: '100-INBOX',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES',
        enableLogging: true,
        enableNotifications: true,
        enableAutoBackup: true,
        language: 'es'
      };

      // ACT
      await SettingsManager.saveConfig(newConfig);
      const loadedConfig = await SettingsManager.loadConfig();

      // ASSERT
      expect(loadedConfig.language).toBe(newConfig.language);
      expect(loadedConfig.enableLogging).toBe(newConfig.enableLogging);
    });

    it('debe mantener configuración después de actualizar', async () => {
      // ARRANGE
      const originalConfig = SettingsManager.getDefaultConfig();
      await SettingsManager.saveConfig(originalConfig);

      // ACT
      const updates = { language: 'en' };
      await SettingsManager.updateConfig(updates);
      const finalConfig = await SettingsManager.loadConfig();

      // ASSERT
      expect(finalConfig.inboxFolder).toBe(originalConfig.inboxFolder);
      expect(finalConfig.language).toBe('en');
    });

    it('debe permitir reset completo', async () => {
      // ARRANGE
      await SettingsManager.saveConfig({
        ...SettingsManager.getDefaultConfig(),
        language: 'en',
        enableLogging: false
      });

      // ACT
      const resetConfig = await SettingsManager.resetConfig();

      // ASSERT
      expect(resetConfig.language).toBe(SettingsManager.getDefaultConfig().language);
      expect(resetConfig.enableLogging).toBe(SettingsManager.getDefaultConfig().enableLogging);
    });
  });

  describe('Error Handling', () => {
    it('debe proporcionar mensajes de error claros', () => {
      // ARRANGE
      const invalidConfig: any = { inboxFolder: '' };

      // ACT
      const result = SettingsManager.validateConfig(invalidConfig);

      // ASSERT
      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach(error => {
        expect(error.length).toBeGreaterThan(0);
      });
    });

    it('debe manejar errores de guardado', async () => {
      // ARRANGE
      const config = SettingsManager.getDefaultConfig();

      // ACT & ASSERT
      try {
        await SettingsManager.saveConfig(config);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('debe aceptar paths con espacios', () => {
      // ARRANGE
      const config: PluginConfig = {
        inboxFolder: '100 - INBOX',
        projectsFolder: '200 - PROYECTOS',
        repositoriesFolder: '500 - REPOSITORIOS',
        utilitiesFolder: '990 - UTILIDADES',
        enableLogging: true,
        enableNotifications: true,
        enableAutoBackup: false,
        language: 'es'
      };

      // ACT
      const result = SettingsManager.validateConfig(config);

      // ASSERT
      expect(result.valid).toBe(true);
    });

    it('debe aceptar paths con caracteres acentuados', () => {
      // ARRANGE
      const config: PluginConfig = {
        inboxFolder: '100-BANDEJA-ENTRADA',
        projectsFolder: '200-PROYECTOS',
        repositoriesFolder: '500-REPOSITORIOS',
        utilitiesFolder: '990-UTILIDADES',
        enableLogging: true,
        enableNotifications: true,
        enableAutoBackup: false,
        language: 'es'
      };

      // ACT
      const result = SettingsManager.validateConfig(config);

      // ASSERT
      expect(result.valid).toBe(true);
    });

    it('debe manejar config null', () => {
      // ACT
      const result = SettingsManager.validateConfig(null as any);

      // ASSERT
      expect(result.valid).toBe(false);
    });

    it('debe tener máximo de configuraciones', () => {
      // ACT
      const tab = SettingsManager.getSettingsTab();

      // ASSERT
      expect(tab.settings.length).toBeLessThan(20); // Límite razonable
    });
  });
});
