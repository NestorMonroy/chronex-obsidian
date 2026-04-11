```yaml
type: Plan de Implementación
title: PLAN DE IMPLEMENTACIÓN - UC-SYS (Core Utilities)
version: 1.0.0
date: 2026-04-11
status: INICIADO
```

# PLAN DE IMPLEMENTACIÓN: UC-SYS (CORE UTILITIES)

## RESUMEN

Implementación de 4 servicios core que son **dependencias de TODOS los demás UC**:

```
UC-SYS01 → ValidateInput (validación robusta)
UC-SYS02 → GenerateUniqueId (IDs con crypto)
UC-SYS03 → ShowNotification (feedback al usuario)
UC-SYS04 → VersionCheck (migraciones de datos)

Timeline: 4-6 horas
Criticidad: CRÍTICA (bloqueador de todo lo demás)
```

---

## UC-SYS01: VALIDAR ENTRADA

### Objetivo
Crear sistema robusto de validación para TODOS los inputs de usuario.

### Requerimientos

```typescript
// validateInput.ts - Validador central

export enum ValidationRule {
  NAME = 'name',           // [a-zA-Z0-9\s\-áéíóú()]
  DESCRIPTION = 'description', // max 1000 chars
  ID_FORMAT = 'id_format',     // {TYPE}-{YYYYMM}-{XXXXX}
  DATE_RANGE = 'date_range',   // fecha válida
  PRIORITY = 'priority',       // [BAJA, MEDIA, ALTA, CRÍTICA]
  STATUS = 'status',          // [pendiente, activo, pausado, completado, archivado]
  EMAIL = 'email',            // email válido (futuro)
  URL = 'url'                 // URL válida (futuro)
}

export class Validator {
  static validateName(value: string): { valid: boolean; error?: string }
  static validateDescription(value: string): { valid: boolean; error?: string }
  static validateIdFormat(value: string): { valid: boolean; error?: string }
  static validateDateRange(from: Date, to: Date): { valid: boolean; error?: string }
  static validatePriority(value: string): { valid: boolean; error?: string }
  static validateStatus(value: string, type: string): { valid: boolean; error?: string }
  static validateAll(data: Record<string, any>, rules: ValidationRule[]): { valid: boolean; errors: string[] }
}
```

### Implementación

**Archivo**: `src/utils/validators.ts`

```typescript
import { ValidationRule } from './types';

export class Validator {
  // Regexes
  private static readonly REGEX_NAME = /^[a-zA-Z0-9\s\-áéíóú()]+$/;
  private static readonly REGEX_ID = /^[A-Z]+-\d{6}-[A-Z0-9]{5}$/;
  private static readonly REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Constantes
  private static readonly MAX_DESCRIPTION_LENGTH = 1000;
  private static readonly MIN_NAME_LENGTH = 3;
  private static readonly MAX_NAME_LENGTH = 150;
  
  /**
   * Validar nombre de proyecto/objetivo/tarea
   */
  static validateName(value: string): { valid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'El nombre no puede estar vacío' };
    }
    
    if (value.length < this.MIN_NAME_LENGTH) {
      return { valid: false, error: `El nombre debe tener al menos ${this.MIN_NAME_LENGTH} caracteres` };
    }
    
    if (value.length > this.MAX_NAME_LENGTH) {
      return { valid: false, error: `El nombre no puede exceder ${this.MAX_NAME_LENGTH} caracteres` };
    }
    
    if (!this.REGEX_NAME.test(value)) {
      return { valid: false, error: 'El nombre contiene caracteres no permitidos' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validar descripción
   */
  static validateDescription(value: string): { valid: boolean; error?: string } {
    if (!value) return { valid: true }; // Opcional
    
    if (value.length > this.MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `La descripción no puede exceder ${this.MAX_DESCRIPTION_LENGTH} caracteres` };
    }
    
    return { valid: true };
  }
  
  /**
   * Validar formato de ID
   */
  static validateIdFormat(value: string): { valid: boolean; error?: string } {
    if (!this.REGEX_ID.test(value)) {
      return { valid: false, error: `Formato de ID inválido: ${value}` };
    }
    return { valid: true };
  }
  
  /**
   * Validar rango de fechas
   */
  static validateDateRange(from: Date, to: Date): { valid: boolean; error?: string } {
    if (!(from instanceof Date) || !(to instanceof Date)) {
      return { valid: false, error: 'Las fechas deben ser objetos Date válidos' };
    }
    
    if (from > to) {
      return { valid: false, error: 'La fecha de inicio no puede ser posterior a la de fin' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validar prioridad
   */
  static validatePriority(value: string): { valid: boolean; error?: string } {
    const validPriorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
    if (!validPriorities.includes(value.toUpperCase())) {
      return { valid: false, error: `Prioridad inválida. Debe ser una de: ${validPriorities.join(', ')}` };
    }
    return { valid: true };
  }
  
  /**
   * Validar estado según tipo de entidad
   */
  static validateStatus(value: string, entityType: string): { valid: boolean; error?: string } {
    const validStatus: Record<string, string[]> = {
      proyecto: ['pendiente', 'activo', 'pausado', 'completado', 'archivado'],
      objetivo: ['pendiente', 'activo', 'completado', 'archivado'],
      tarea: ['pendiente', 'en_progreso', 'bloqueada', 'completada', 'archivada'],
      documento: ['archivado', 'activo']
    };
    
    const allowed = validStatus[entityType] || [];
    if (!allowed.includes(value.toLowerCase())) {
      return { valid: false, error: `Estado inválido para ${entityType}. Permitidos: ${allowed.join(', ')}` };
    }
    
    return { valid: true };
  }
  
  /**
   * Validar múltiples campos
   */
  static validateAll(data: Record<string, any>, rules: Record<string, any>): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      let result: { valid: boolean; error?: string };
      
      switch (rule.type) {
        case 'name':
          result = this.validateName(value);
          break;
        case 'description':
          result = this.validateDescription(value);
          break;
        case 'id':
          result = this.validateIdFormat(value);
          break;
        case 'priority':
          result = this.validatePriority(value);
          break;
        case 'status':
          result = this.validateStatus(value, rule.entityType);
          break;
        default:
          continue;
      }
      
      if (!result.valid) {
        errors[field] = result.error || 'Validación fallida';
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}
```

### Tests

**Archivo**: `tests/unit/validators.test.ts`

```typescript
import { Validator } from '../../src/utils/validators';

describe('Validator', () => {
  describe('validateName', () => {
    it('should validate correct name', () => {
      const result = Validator.validateName('Mi Proyecto');
      expect(result.valid).toBe(true);
    });
    
    it('should reject empty name', () => {
      const result = Validator.validateName('');
      expect(result.valid).toBe(false);
    });
    
    it('should reject name with invalid characters', () => {
      const result = Validator.validateName('Proyecto@#$');
      expect(result.valid).toBe(false);
    });
    
    it('should reject name too short', () => {
      const result = Validator.validateName('AB');
      expect(result.valid).toBe(false);
    });
    
    it('should accept name with special allowed characters', () => {
      const result = Validator.validateName('Proyecto-2026 (Beta)');
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateDescription', () => {
    it('should accept empty description', () => {
      const result = Validator.validateDescription('');
      expect(result.valid).toBe(true);
    });
    
    it('should accept valid description', () => {
      const result = Validator.validateDescription('Una descripción válida');
      expect(result.valid).toBe(true);
    });
    
    it('should reject description too long', () => {
      const longText = 'x'.repeat(1001);
      const result = Validator.validateDescription(longText);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validateIdFormat', () => {
    it('should validate correct ID format', () => {
      const result = Validator.validateIdFormat('PROJ-202604-A1B2C');
      expect(result.valid).toBe(true);
    });
    
    it('should reject invalid ID format', () => {
      const result = Validator.validateIdFormat('invalid-id');
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validatePriority', () => {
    it('should validate correct priorities', () => {
      ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'].forEach(priority => {
        const result = Validator.validatePriority(priority);
        expect(result.valid).toBe(true);
      });
    });
    
    it('should reject invalid priority', () => {
      const result = Validator.validatePriority('URGENTE');
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validateStatus', () => {
    it('should validate correct project status', () => {
      const result = Validator.validateStatus('activo', 'proyecto');
      expect(result.valid).toBe(true);
    });
    
    it('should reject invalid status for entity type', () => {
      const result = Validator.validateStatus('en_progreso', 'proyecto');
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validateAll', () => {
    it('should validate all fields correctly', () => {
      const data = {
        nombre: 'Mi Proyecto',
        descripcion: 'Una buena descripción',
        prioridad: 'ALTA'
      };
      
      const rules = {
        nombre: { type: 'name' },
        descripcion: { type: 'description' },
        prioridad: { type: 'priority' }
      };
      
      const result = Validator.validateAll(data, rules);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
    
    it('should return errors for invalid fields', () => {
      const data = {
        nombre: '',
        descripcion: 'OK',
        prioridad: 'INVÁLIDA'
      };
      
      const rules = {
        nombre: { type: 'name' },
        descripcion: { type: 'description' },
        prioridad: { type: 'priority' }
      };
      
      const result = Validator.validateAll(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors['nombre']).toBeDefined();
      expect(result.errors['prioridad']).toBeDefined();
    });
  });
});
```

### Checklist

- [ ] `src/utils/validators.ts` creado con clase Validator
- [ ] Todos los métodos de validación implementados
- [ ] Regexes definidos correctamente
- [ ] `tests/unit/validators.test.ts` creado
- [ ] Todos los tests pasan
- [ ] Documentación en código completa
- [ ] Integrado en main.ts

---

## UC-SYS02: GENERAR ID ÚNICO

### Objetivo
Generar IDs únicos garantizados usando Web Crypto API.

### Implementación

**Archivo**: `src/utils/generateUniqueId.ts`

```typescript
/**
 * Generar ID único en formato: {TYPE}-{YYYYMM}-{XXXXX}
 * Ejemplo: PROJ-202604-A1B2C
 * 
 * Usa Web Crypto API para garantizar aleatoriedad criptográfica
 */
export class IdGenerator {
  private static readonly CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  /**
   * Generar componente aleatorio de 5 caracteres
   */
  static generateRandomPart(length: number = 5): string {
    const chars = new Uint8Array(length);
    crypto.getRandomValues(chars);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.CHARSET[chars[i] % this.CHARSET.length];
    }
    return result;
  }
  
  /**
   * Generar ID completo
   */
  static generate(type: string): string {
    const yearMonth = this.getYearMonth();
    const randomPart = this.generateRandomPart();
    
    return `${type}-${yearMonth}-${randomPart}`;
  }
  
  /**
   * Obtener YYYYMM actual
   */
  private static getYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }
  
  /**
   * Validar formato de ID
   */
  static isValidFormat(id: string): boolean {
    const regex = /^[A-Z]+-\d{6}-[A-Z0-9]{5}$/;
    return regex.test(id);
  }
}

// Tipos de ID según entidad
export const ID_TYPES = {
  PROJECT: 'PROJ',
  OBJECTIVE: 'OBJ',
  TASK: 'TSK',
  DOCUMENT: 'DOC',
  REPOSITORY: 'REPO',
  KEY_RESULT: 'KR'
} as const;
```

### Tests

**Archivo**: `tests/unit/generateUniqueId.test.ts`

```typescript
import { IdGenerator, ID_TYPES } from '../../src/utils/generateUniqueId';

describe('IdGenerator', () => {
  describe('generate', () => {
    it('should generate ID with correct format', () => {
      const id = IdGenerator.generate(ID_TYPES.PROJECT);
      expect(id).toMatch(/^PROJ-\d{6}-[A-Z0-9]{5}$/);
    });
    
    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(IdGenerator.generate(ID_TYPES.DOCUMENT));
      }
      expect(ids.size).toBe(100); // Sin duplicados
    });
    
    it('should include current year-month', () => {
      const id = IdGenerator.generate(ID_TYPES.TASK);
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(id).toContain(yearMonth);
    });
  });
  
  describe('isValidFormat', () => {
    it('should validate correct ID format', () => {
      expect(IdGenerator.isValidFormat('PROJ-202604-A1B2C')).toBe(true);
      expect(IdGenerator.isValidFormat('DOC-202604-ABC12')).toBe(true);
    });
    
    it('should reject invalid formats', () => {
      expect(IdGenerator.isValidFormat('invalid')).toBe(false);
      expect(IdGenerator.isValidFormat('PROJ-2026-ABC')).toBe(false);
    });
  });
  
  describe('generateRandomPart', () => {
    it('should generate random part of correct length', () => {
      const part = IdGenerator.generateRandomPart(5);
      expect(part.length).toBe(5);
    });
    
    it('should only use allowed characters', () => {
      const part = IdGenerator.generateRandomPart(100);
      expect(/^[A-Z0-9]+$/.test(part)).toBe(true);
    });
  });
});
```

### Checklist

- [ ] `src/utils/generateUniqueId.ts` creado
- [ ] Web Crypto API integrada
- [ ] ID_TYPES constants definidas
- [ ] `tests/unit/generateUniqueId.test.ts` creado
- [ ] Todos los tests pasan (sin duplicados en 100+ generaciones)
- [ ] Integrado en main.ts

---

## UC-SYS03: MOSTRAR NOTIFICACIÓN

### Objetivo
Wrapper de notificaciones con tipos (info, warning, error).

### Implementación

**Archivo**: `src/utils/notificationHelper.ts`

```typescript
import { Notice } from 'obsidian';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export class NotificationHelper {
  private static readonly DURATION_MS = 5000; // 5 segundos
  
  static show(
    message: string,
    type: NotificationType = NotificationType.INFO
  ): Notice {
    const notice = new Notice(message, this.DURATION_MS);
    
    // Agregar clase CSS para estilos según tipo
    const noticeElement = document.querySelector('.notice:last-child');
    if (noticeElement) {
      noticeElement.classList.add(`notification-${type}`);
    }
    
    return notice;
  }
  
  static info(message: string): Notice {
    return this.show(message, NotificationType.INFO);
  }
  
  static success(message: string): Notice {
    return this.show(message, NotificationType.SUCCESS);
  }
  
  static warning(message: string): Notice {
    return this.show(message, NotificationType.WARNING);
  }
  
  static error(message: string): Notice {
    return this.show(message, NotificationType.ERROR);
  }
}
```

### Styles

**Archivo**: `src/styles/notifications.css`

```css
/* Estilos para notificaciones */

.notice.notification-info {
  border-left: 4px solid var(--color-blue);
  background-color: rgba(0, 120, 215, 0.1);
}

.notice.notification-success {
  border-left: 4px solid var(--color-green);
  background-color: rgba(0, 176, 0, 0.1);
}

.notice.notification-warning {
  border-left: 4px solid var(--color-yellow);
  background-color: rgba(255, 191, 0, 0.1);
}

.notice.notification-error {
  border-left: 4px solid var(--color-red);
  background-color: rgba(211, 0, 21, 0.1);
}
```

### Checklist

- [ ] `src/utils/notificationHelper.ts` creado
- [ ] NotificationType enum definido
- [ ] Métodos: show, info, success, warning, error
- [ ] `src/styles/notifications.css` creado
- [ ] Integrado en main.ts
- [ ] Probado en navegador (visualmente)

---

## UC-SYS04: ACTUALIZAR VERSIÓN

### Objetivo
Sistema de versionamiento y migraciones de datos.

### Implementación

**Archivo**: `src/utils/versionManager.ts`

```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface PluginData {
  version: string;
  lastUpdated: string;
  dataVersion: number;
}

export class VersionManager {
  private app: App;
  private pluginId: string;
  private currentVersion: string;
  
  constructor(app: App, pluginId: string, currentVersion: string) {
    this.app = app;
    this.pluginId = pluginId;
    this.currentVersion = currentVersion;
  }
  
  /**
   * Obtener datos versionados
   */
  async getPluginData(): Promise<PluginData> {
    const data = await this.app.plugins.plugins[this.pluginId]?.loadData();
    return data || {
      version: '0.0.0',
      lastUpdated: new Date().toISOString(),
      dataVersion: 0
    };
  }
  
  /**
   * Guardar datos versionados
   */
  async savePluginData(data: PluginData): Promise<void> {
    data.version = this.currentVersion;
    data.lastUpdated = new Date().toISOString();
    await this.app.plugins.plugins[this.pluginId]?.saveData(data);
  }
  
  /**
   * Detectar si necesita migración
   */
  async needsMigration(): Promise<boolean> {
    const data = await this.getPluginData();
    return data.version !== this.currentVersion;
  }
  
  /**
   * Ejecutar migraciones
   */
  async runMigrations(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = this.getMigrationPath(fromVersion, toVersion);
    
    for (const migration of migrations) {
      console.log(`Ejecutando migración: ${migration.name}`);
      await migration.execute();
    }
  }
  
  /**
   * Obtener secuencia de migraciones
   */
  private getMigrationPath(fromVersion: string, toVersion: string) {
    const allMigrations = [
      {
        name: 'v0.0.1 → v0.1.0',
        fromVersion: '0.0.1',
        toVersion: '0.1.0',
        execute: async () => this.migrationInitialSchema()
      },
      {
        name: 'v0.1.0 → v1.0.0',
        fromVersion: '0.1.0',
        toVersion: '1.0.0',
        execute: async () => this.migrationV1Structure()
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
   * Convertir versión a número para comparación
   */
  private versionToNumber(version: string): number {
    const [major, minor, patch] = version.split('.').map(Number);
    return major * 10000 + minor * 100 + patch;
  }
  
  /**
   * Migración inicial de schema
   */
  private async migrationInitialSchema(): Promise<void> {
    // Crear estructura de carpetas base si no existe
    const folders = ['100-INBOX', '200-PROYECTOS', '500-REPOSITORIOS', '990-UTILIDADES'];
    for (const folder of folders) {
      await this.createFolderIfNotExists(folder);
    }
  }
  
  /**
   * Migración a estructura v1
   */
  private async migrationV1Structure(): Promise<void> {
    // Actualizar metadata de archivos existentes si es necesario
    console.log('Migrando estructura a v1.0.0');
  }
  
  /**
   * Crear carpeta si no existe
   */
  private async createFolderIfNotExists(folderPath: string): Promise<void> {
    try {
      await this.app.vault.getAbstractFileByPath(folderPath);
    } catch {
      await this.app.vault.createFolder(folderPath);
    }
  }
}
```

### Checklist

- [ ] `src/utils/versionManager.ts` creado
- [ ] PluginData interface definida
- [ ] Métodos: getPluginData, savePluginData, needsMigration, runMigrations
- [ ] Sistema de migraciones implementado
- [ ] Integrado en plugin main.ts
- [ ] Log de versión en consola

---

## RESUMEN DE IMPLEMENTACIÓN UC-SYS

| UC | Archivo | Componentes | Tests | Horas |
|----|---------|-------------|-------|-------|
| UC-SYS01 | validators.ts | Validator class, 6 métodos | 6 test suites | 1-2h |
| UC-SYS02 | generateUniqueId.ts | IdGenerator class, crypto | 4 test suites | 1h |
| UC-SYS03 | notificationHelper.ts | NotificationHelper, CSS | UI testing | 0.5h |
| UC-SYS04 | versionManager.ts | VersionManager, migrations | 2 test suites | 1-2h |

**Total UC-SYS**: 3.5-5.5 horas

---

## ORDEN DE IMPLEMENTACIÓN

1. ✅ **UC-SYS02** primero (GenerateUniqueId - sin dependencias)
2. ✅ **UC-SYS01** luego (Validator - sin dependencias)
3. ✅ **UC-SYS03** luego (Notifications - sin dependencias)
4. ✅ **UC-SYS04** al final (VersionManager - puede necesitar otros)

Todos estos son independientes, pueden hacerse en paralelo.

---

## NEXT: CREAR ARCHIVOS

Vamos a crear:
1. `src/utils/validators.ts` (completo)
2. `src/utils/generateUniqueId.ts` (completo)
3. `src/utils/notificationHelper.ts` (completo)
4. `src/utils/versionManager.ts` (completo)
5. Tests para cada uno
6. Integración en main.ts

---

**Estado**: PLAN COMPLETADO - LISTO PARA CODIFICACIÓN
**Próximo paso**: Crear UC-SYS02 (GenerateUniqueId)
