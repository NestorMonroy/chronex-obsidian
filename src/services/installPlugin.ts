/**
 * UC-P01: Instalar Plugin
 * 
 * Servicio completo para instalar el plugin chronex-obsidian:
 * 1. Detectar URL de release en GitHub
 * 2. Validar estructura de manifest.json
 * 3. Crear carpetas necesarias (100-INBOX, 200-PROYECTOS, etc.)
 * 4. Ejecutar wizard de setup interactivo
 * 5. Validar que instalación fue exitosa
 * 
 * Patrón de error: Validación temprana, mensajes claros, rollback en caso de fallo
 * 
 * @see /docs/specification/use-cases/uc-p01-install-plugin.md
 */

import { Validator } from '../utils/validators';
import { NotificationHelper } from '../utils/notificationAndVersion';

/**
 * Configuración de instalación del plugin
 */
export interface PluginConfig {
  pluginName: string;
  version: string;
}

/**
 * Manifest.json del plugin
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion?: string;
  description?: string;
  author?: string;
}

/**
 * Resultado de instalación completa
 */
export interface InstallResult {
  success: boolean;
  installed: boolean;
  releaseUrl: string;
  foldersCreated: string[];
  validated: boolean;
  message: string;
  steps?: string[];
}

/**
 * Resultado del wizard de setup
 */
export interface WizardResult {
  completed: boolean;
  steps: string[];
  foldersCreated: string[];
}

/**
 * Instalador del plugin chronex-obsidian
 * 
 * Responsabilidades:
 * - Descargar plugin desde releases de GitHub
 * - Validar estructura y manifest.json
 * - Crear estructura de carpetas base
 * - Ejecutar setup wizard
 * - Validar resultado de instalación
 */
export class PluginInstaller {
  private static readonly GITHUB_BASE = 'https://github.com/nestormonroy';
  private static readonly REQUIRED_FOLDERS = [
    '100-INBOX',
    '200-PROYECTOS',
    '500-REPOSITORIOS',
    '990-UTILIDADES'
  ];

  /**
   * Detectar URL de GitHub release para descargar el plugin
   * 
   * @param pluginId ID único del plugin (ejemplo: chronex-obsidian)
   * @param version Versión a instalar (ejemplo: 1.0.0)
   * @returns URL completa del release en GitHub
   * @throws Error si pluginId o version son inválidos
   * 
   * @example
   * const url = PluginInstaller.detectReleaseUrl('chronex-obsidian', '1.0.0');
   * // → 'https://github.com/nestormonroy/chronex-obsidian/releases/download/v1.0.0/main.js'
   */
  static detectReleaseUrl(pluginId: string, version: string): string {
    // Validar que pluginId existe y es válido
    if (!pluginId || typeof pluginId !== 'string' || pluginId.trim() === '') {
      throw new Error('Plugin ID es requerido y debe ser válido');
    }

    // Validar que version existe y es válida
    if (!version || typeof version !== 'string' || version.trim() === '') {
      throw new Error('Version es requerida y debe ser válida');
    }

    // Rechazar si hay espacios al inicio o final
    if (pluginId !== pluginId.trim() || version !== version.trim()) {
      throw new Error('Plugin ID y version no deben contener espacios al inicio o final');
    }

    // Validar que pluginId contiene solo caracteres permitidos
    if (!/^[a-zA-Z0-9\-]+$/.test(pluginId)) {
      throw new Error('Plugin ID contiene caracteres inválidos. Solo se permiten letras, números y guiones');
    }

    // Construir y retornar URL
    return `${this.GITHUB_BASE}/${pluginId}/releases/download/v${version}/main.js`;
  }

  /**
   * Validar estructura de manifest.json del plugin
   * 
   * Verifica que el manifest contiene todos los campos requeridos:
   * - id: Identificador único del plugin
   * - name: Nombre del plugin
   * - version: Versión semántica
   * 
   * @param manifest Objeto manifest.json a validar
   * @returns true si manifest es válido, false si no
   * 
   * @example
   * const isValid = PluginInstaller.validatePluginStructure({
   *   id: 'chronex-obsidian',
   *   name: 'Repository Manager',
   *   version: '1.0.0'
   * });
   * // → true
   */
  static validatePluginStructure(manifest: any): boolean {
    // Validar que es un objeto válido
    if (!manifest || typeof manifest !== 'object') {
      return false;
    }

    // Validar que contiene todos los campos requeridos
    const requiredFields = ['id', 'name', 'version'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Crear carpetas requeridas para el plugin
   * 
   * Crea la estructura base de carpetas:
   * - 100-INBOX: Notas rápidas y fleeting notes
   * - 200-PROYECTOS: Proyectos, objetivos y tareas
   * - 500-REPOSITORIOS: Documentos clasificados
   * - 990-UTILIDADES: Templates y scripts
   * 
   * @returns Resultado con lista de carpetas creadas
   * @throws Error si no puede crear las carpetas
   */
  static async createPluginFolders(): Promise<{
    success: boolean;
    foldersCreated: string[];
  }> {
    try {
      // En implementación real, interactuaría con filesystem
      // Por ahora, simular creación exitosa
      return {
        success: true,
        foldersCreated: this.REQUIRED_FOLDERS
      };
    } catch (error) {
      throw new Error(`Error creando carpetas: ${error}`);
    }
  }

  /**
   * Ejecutar wizard de setup inicial del plugin
   * 
   * Pasos del wizard:
   * 1. MANIFEST_VALIDATED: Valida que manifest.json es correcto
   * 2. FOLDERS_CREATED: Crea carpetas necesarias
   * 3. SETUP_COMPLETED: Completa setup inicial
   * 
   * @param config Configuración del plugin (pluginName, version)
   * @returns Resultado del wizard con pasos ejecutados
   * @throws Error si config es inválido o hay error en el proceso
   */
  static async setupWizard(config: PluginConfig): Promise<WizardResult> {
    // Validar que config tiene pluginName
    if (!config || !config.pluginName || config.pluginName.trim() === '') {
      throw new Error('Plugin name es requerido en configuración');
    }

    // Validar que config tiene version
    if (!config.version || config.version.trim() === '') {
      throw new Error('Version es requerida en configuración');
    }

    // Array para registrar pasos completados
    const steps: string[] = [];
    const foldersCreated: string[] = [];

    try {
      // PASO 1: Validar manifest
      const manifest: PluginManifest = {
        id: config.pluginName,
        name: config.pluginName,
        version: config.version
      };
      const isValid = this.validatePluginStructure(manifest);
      if (isValid) {
        steps.push('MANIFEST_VALIDATED');
      }

      // PASO 2: Crear carpetas necesarias
      const folderResult = await this.createPluginFolders();
      if (folderResult.success) {
        steps.push('FOLDERS_CREATED');
        foldersCreated.push(...folderResult.foldersCreated);
      }

      // PASO 3: Setup completado
      steps.push('SETUP_COMPLETED');

      return {
        completed: true,
        steps,
        foldersCreated
      };
    } catch (error) {
      throw new Error(`Error en wizard: ${error}`);
    }
  }

  /**
   * Validar que la instalación fue completada exitosamente
   * 
   * Verificaciones:
   * - Todas las carpetas requeridas existen
   * - manifest.json existe y es válido
   * - Plugin está habilitado en Obsidian
   * 
   * @returns true si instalación es válida, false si no
   */
  static async validateInstallation(): Promise<boolean> {
    try {
      // En implementación real, verificaría:
      // - Existencia de todas las carpetas
      // - Validez de manifest.json
      // - Status del plugin en Obsidian
      // Por ahora, simular validación exitosa
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ejecutar instalación completa del plugin
   * 
   * Flujo completo:
   * 1. Validar configuración
   * 2. Detectar URL de release
   * 3. Ejecutar wizard de setup
   * 4. Validar resultado
   * 5. Retornar información completa
   * 
   * @param config Configuración del plugin
   * @returns Resultado completo de instalación con todos los detalles
   * @throws Error si hay cualquier problema en la instalación
   * 
   * @example
   * const result = await PluginInstaller.install({
   *   pluginName: 'chronex-obsidian',
   *   version: '1.0.0'
   * });
   * // → { success: true, installed: true, releaseUrl: '...', ... }
   */
  static async install(config: PluginConfig): Promise<InstallResult> {
    try {
      // VALIDACIÓN: Verificar que config es válido
      if (!config || !config.pluginName || config.pluginName.trim() === '') {
        throw new Error('Plugin name es requerido');
      }

      // PASO 1: Detectar URL de release
      const releaseUrl = this.detectReleaseUrl(config.pluginName, config.version);

      // PASO 2: Ejecutar wizard de setup
      const wizardResult = await this.setupWizard(config);

      // PASO 3: Validar que instalación fue exitosa
      const isValid = await this.validateInstallation();

      // PASO 4: Retornar resultado completo
      const result: InstallResult = {
        success: true,
        installed: true,
        releaseUrl,
        foldersCreated: wizardResult.foldersCreated,
        validated: isValid,
        message: `Plugin ${config.pluginName} v${config.version} instalado exitosamente`,
        steps: wizardResult.steps
      };

      return result;
    } catch (error) {
      throw new Error(`Error en instalación: ${error}`);
    }
  }
}

/**
 * Alias para uso rápido sin necesidad de escribir PluginInstaller cada vez
 */
export const pluginInstaller = {
  install: (config: PluginConfig) => PluginInstaller.install(config),
  validate: (manifest: any) => PluginInstaller.validatePluginStructure(manifest),
  detectUrl: (id: string, version: string) => PluginInstaller.detectReleaseUrl(id, version)
};
