/**
 * UC-SYS03 & UC-SYS04: NOTIFICACIONES Y VERSIONAMIENTO
 */

import { Notice, App } from 'obsidian';

// ============================================================
// UC-SYS03: MOSTRAR NOTIFICACIÓN
// ============================================================

/**
 * Tipos de notificación
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Helper para mostrar notificaciones al usuario
 */
export class NotificationHelper {
  private static readonly DURATION_MS = 5000; // 5 segundos

  /**
   * Mostrar notificación
   */
  static show(
    message: string,
    type: NotificationType = NotificationType.INFO
  ): Notice {
    const notice = new Notice(message, this.DURATION_MS);

    // Agregar clase CSS para estilos
    const noticeElement = document.querySelector('.notice:last-child');
    if (noticeElement) {
      noticeElement.classList.add(`notification-${type}`);
    }

    return notice;
  }

  /**
   * Notificación de información
   */
  static info(message: string): Notice {
    console.log('[INFO]', message);
    return this.show(message, NotificationType.INFO);
  }

  /**
   * Notificación de éxito
   */
  static success(message: string): Notice {
    console.log('[SUCCESS]', message);
    return this.show(message, NotificationType.SUCCESS);
  }

  /**
   * Notificación de advertencia
   */
  static warning(message: string): Notice {
    console.warn('[WARNING]', message);
    return this.show(message, NotificationType.WARNING);
  }

  /**
   * Notificación de error
   */
  static error(message: string): Notice {
    console.error('[ERROR]', message);
    return this.show(message, NotificationType.ERROR);
  }

  /**
   * Notificación con duración personalizada
   */
  static showCustom(
    message: string,
    type: NotificationType = NotificationType.INFO,
    durationMs: number = this.DURATION_MS
  ): Notice {
    const notice = new Notice(message, durationMs);

    const noticeElement = document.querySelector('.notice:last-child');
    if (noticeElement) {
      noticeElement.classList.add(`notification-${type}`);
    }

    return notice;
  }
}

// ============================================================
// UC-SYS04: ACTUALIZAR VERSIÓN / VERSION MANAGER
// ============================================================

/**
 * Datos de versionamiento del plugin
 */
export interface PluginData {
  version: string;
  lastUpdated: string;
  dataVersion: number;
  settings?: Record<string, any>;
}

/**
 * Definición de una migración
 */
interface Migration {
  name: string;
  fromVersion: string;
  toVersion: string;
  execute: () => Promise<void>;
}

/**
 * Gestor de versiones y migraciones
 */
export class VersionManager {
  private app: App;
  private pluginId: string;
  private currentVersion: string;
  private plugin: any;

  constructor(app: App, plugin: any, currentVersion: string) {
    this.app = app;
    this.plugin = plugin;
    this.pluginId = plugin.manifest?.id || 'chronex-obsidian';
    this.currentVersion = currentVersion;
  }

  /**
   * Obtener datos versionados actuales
   */
  async getPluginData(): Promise<PluginData> {
    try {
      const data = await this.plugin.loadData();
      return (
        data || {
          version: '0.0.0',
          lastUpdated: new Date().toISOString(),
          dataVersion: 0
        }
      );
    } catch (error) {
      console.error('Error loading plugin data:', error);
      return {
        version: '0.0.0',
        lastUpdated: new Date().toISOString(),
        dataVersion: 0
      };
    }
  }

  /**
   * Guardar datos versionados
   */
  async savePluginData(data: PluginData): Promise<void> {
    data.version = this.currentVersion;
    data.lastUpdated = new Date().toISOString();
    try {
      await this.plugin.saveData(data);
      console.log('Plugin data saved:', data.version);
    } catch (error) {
      console.error('Error saving plugin data:', error);
    }
  }

  /**
   * Detectar si se necesita migración
   */
  async needsMigration(): Promise<boolean> {
    const data = await this.getPluginData();
    return data.version !== this.currentVersion;
  }

  /**
   * Ejecutar migraciones necesarias
   */
  async runMigrations(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = this.getMigrationPath(fromVersion, toVersion);

    console.log(`Running ${migrations.length} migration(s) from ${fromVersion} to ${toVersion}`);

    for (const migration of migrations) {
      try {
        console.log(`Executing migration: ${migration.name}`);
        await migration.execute();
        console.log(`✓ Migration complete: ${migration.name}`);
      } catch (error) {
        console.error(`✗ Migration failed: ${migration.name}`, error);
        throw error;
      }
    }

    NotificationHelper.success(`Plugin actualizado a versión ${toVersion}`);
  }

  /**
   * Obtener secuencia de migraciones a ejecutar
   */
  private getMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    const allMigrations: Migration[] = [
      {
        name: 'v0.0.0 → v0.1.0: Estructura inicial',
        fromVersion: '0.0.0',
        toVersion: '0.1.0',
        execute: () => this.migrationInitialSchema()
      },
      {
        name: 'v0.1.0 → v1.0.0: Estructura de producción',
        fromVersion: '0.1.0',
        toVersion: '1.0.0',
        execute: () => this.migrationV1Structure()
      }
    ];

    return allMigrations.filter(m => {
      const from = this.versionToNumber(m.fromVersion);
      const to = this.versionToNumber(m.toVersion);
      const currentFrom = this.versionToNumber(fromVersion);
      const currentTo = this.versionToNumber(toVersion);

      return from >= currentFrom && to <= currentTo;
    });
  }

  /**
   * Convertir versión string a número para comparación
   * Ejemplo: "1.2.3" → 10203
   */
  private versionToNumber(version: string): number {
    const parts = version.split('.').map(p => parseInt(p) || 0);
    const [major, minor, patch] = parts;
    return major * 10000 + minor * 100 + patch;
  }

  /**
   * Migración: crear estructura base
   */
  private async migrationInitialSchema(): Promise<void> {
    const folders = ['100-INBOX', '200-PROYECTOS', '500-REPOSITORIOS', '990-UTILIDADES'];

    for (const folderPath of folders) {
      await this.createFolderIfNotExists(folderPath);
    }

    console.log('✓ Initial schema created');
  }

  /**
   * Migración: estructura v1.0.0
   */
  private async migrationV1Structure(): Promise<void> {
    // Crear subcarpetas de utilidades
    const subfolders = [
      '990-UTILIDADES/991-template',
      '990-UTILIDADES/992-script',
      '990-UTILIDADES/992-script/core-services',
      '990-UTILIDADES/992-script/common',
      '990-UTILIDADES/audit'
    ];

    for (const folderPath of subfolders) {
      await this.createFolderIfNotExists(folderPath);
    }

    console.log('✓ v1.0.0 structure created');
  }

  /**
   * Crear carpeta si no existe
   */
  private async createFolderIfNotExists(folderPath: string): Promise<void> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await this.app.vault.createFolder(folderPath);
        console.log(`Created folder: ${folderPath}`);
      }
    } catch (error) {
      // Folder might already exist
      console.debug(`Folder already exists or error: ${folderPath}`);
    }
  }

  /**
   * Obtener información de versión actual
   */
  async getVersionInfo(): Promise<{
    current: string;
    stored: string;
    needsUpdate: boolean;
  }> {
    const data = await this.getPluginData();
    return {
      current: this.currentVersion,
      stored: data.version,
      needsUpdate: this.currentVersion !== data.version
    };
  }

  /**
   * Registrar cambio de versión en log
   */
  async logVersionChange(fromVersion: string, toVersion: string): Promise<void> {
    const log = {
      timestamp: new Date().toISOString(),
      fromVersion,
      toVersion,
      executedAt: new Date().toLocaleString()
    };

    console.log('Version change logged:', log);
  }

  /**
   * Inicializar versionamiento (llamar en plugin onload)
   */
  async initialize(): Promise<void> {
    const needsMigration = await this.needsMigration();

    if (needsMigration) {
      const data = await this.getPluginData();
      console.log(`Migration needed: ${data.version} → ${this.currentVersion}`);

      try {
        await this.runMigrations(data.version, this.currentVersion);
        await this.logVersionChange(data.version, this.currentVersion);
      } catch (error) {
        NotificationHelper.error('Error durante migración de plugin');
        console.error('Migration failed:', error);
      }
    } else {
      console.log(`Plugin up to date: ${this.currentVersion}`);
    }
  }
}

/**
 * Alias para uso rápido
 */
export const notify = {
  info: (msg: string) => NotificationHelper.info(msg),
  success: (msg: string) => NotificationHelper.success(msg),
  warning: (msg: string) => NotificationHelper.warning(msg),
  error: (msg: string) => NotificationHelper.error(msg)
};
