```yaml
type: Template Development
title: TEMPLATE TDD - Patrón para siguientes UC
version: 1.0.0
purpose: Guía para desarrollar UC siguientes con Test-Driven Development
```

# TEMPLATE TDD: PATRÓN PARA PRÓXIMOS UC

## 📋 PATRÓN A SEGUIR

```
PASO 1: ESCRIBIR TESTS (RED)
  ├─ Crear tests/unit/uc-{number}-{name}.test.ts
  ├─ Escribir TODOS los tests PRIMERO
  ├─ Los tests fallan (RED)
  └─ Tiempo: 30-45 minutos por UC

PASO 2: IMPLEMENTACIÓN MÍNIMA (GREEN)
  ├─ Crear src/services/uc-{number}-{name}.ts
  ├─ Implementación MÍNIMA para pasar tests
  ├─ Los tests pasan (GREEN)
  └─ Tiempo: 30-45 minutos por UC

PASO 3: REFACTORIZAR (REFACTOR)
  ├─ Mejorar código
  ├─ Agregar documentación
  ├─ Optimizar performance
  └─ Tiempo: 15-30 minutos por UC

PASO 4: COMMIT
  ├─ Commit con mensaje descriptivo
  ├─ Tests siguen pasando
  └─ Código listo para review
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Plantilla de test

**Archivo**: `tests/unit/uc-{number}-{name}.test.ts`

```typescript
/**
 * Tests para UC-{NUMBER}: {NOMBRE DEL UC}
 * 
 * @see /docs/specification/use-cases/uc-{number}-{name}.md
 */

import { /* imports */ } from '../../src/services/uc-{number}-{name}';

describe('UC-{NUMBER}: {NOMBRE}', () => {
  
  describe('método1', () => {
    it('happy path: debe hacer X correctamente', () => {
      // ARRANGE
      const input = { /* datos */ };
      
      // ACT
      const result = funcionAProbar(input);
      
      // ASSERT
      expect(result).toEqual(/* resultado esperado */);
    });

    it('edge case: debe manejar Y correctamente', () => {
      // ...
    });

    it('error: debe lanzar error si falta Z', () => {
      expect(() => funcionAProbar(null)).toThrow();
    });
  });

  describe('método2', () => {
    // Similar structure
  });

  describe('Integration', () => {
    it('debe funcionar end-to-end', () => {
      // Pruebas que combinan múltiples métodos
    });
  });
});
```

### Plantilla de implementación

**Archivo**: `src/services/uc-{number}-{name}.ts`

```typescript
/**
 * UC-{NUMBER}: {NOMBRE DEL UC}
 * 
 * {Descripción breve}
 * 
 * @see /docs/specification/use-cases/uc-{number}-{name}.md
 */

import { Validator } from '../utils/validators';
import { NotificationHelper } from '../utils/notificationAndVersion';

export interface {NombreInput} {
  // Propiedades del input
}

export interface {NombreOutput} {
  // Propiedades del output
}

/**
 * Clase principal del UC
 */
export class {NombreServicio} {
  /**
   * Método principal
   */
  static async metodo1(input: {NombreInput}): Promise<{NombreOutput}> {
    // Validar input
    const validation = Validator.validateName(input.nombre);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Lógica principal
    // ...

    // Retornar resultado
    return {
      // resultado
    };
  }

  /**
   * Método secundario
   */
  static metodo2(data: any): boolean {
    // ...
  }
}

/**
 * Aliases para uso rápido
 */
export const {nombreServicio} = {
  metodo1: ({NombreServicio}).metodo1,
  metodo2: ({NombreServicio}).metodo2
};
```

---

## ✅ CHECKLIST POR UC

### Antes de empezar

- [ ] Leer UC documentado completamente
- [ ] Entender precondiciones y postcondiciones
- [ ] Identificar todos los flujos (happy path + alternativos)
- [ ] Listar casos de prueba necesarios

### Escribir tests (RED)

- [ ] Crear archivo `tests/unit/uc-{number}-{name}.test.ts`
- [ ] Escribir imports correctos
- [ ] Happy path test (flujo normal)
- [ ] Edge cases tests (límites, casos especiales)
- [ ] Error handling tests (errores esperados)
- [ ] Integration tests (flujos completos)
- [ ] Performance tests (si aplica)
- [ ] Verificar que TODOS los tests fallan

### Implementación (GREEN)

- [ ] Crear archivo `src/services/uc-{number}-{name}.ts`
- [ ] Implementación MÍNIMA de cada método
- [ ] Importar validators y helpers necesarios
- [ ] Validar inputs
- [ ] Manejar errores
- [ ] Retornar resultados esperados
- [ ] Verificar que TODOS los tests pasan

### Refactor y documentación

- [ ] Mejorar nombres de variables
- [ ] Extraer métodos privados si es necesario
- [ ] Agregar JSDoc completo
- [ ] Agregar ejemplos en comentarios
- [ ] Verificar coverage (target: 100%)
- [ ] Tests siguen pasando
- [ ] Limpiar código innecesario

### Commit

- [ ] `git add .`
- [ ] `git commit -m "FEAT/TEST: UC-{number} - {descripción}"`
- [ ] Verificar con `git log --oneline`

---

## 📊 TEMPLATE DE COMMIT MESSAGE

```bash
# Para UC nuevo
git commit -m "FEAT: UC-{number} - {nombre corto}

Implementación de {descripción breve}:
- {funcionalidad 1}
- {funcionalidad 2}
- {funcionalidad 3}

Tests:
- {número de tests} tests PASS
- Coverage: {porcentaje}%

Próximo: {siguiente UC}"

# Ejemplo
git commit -m "FEAT: UC-P01 - Instalar plugin

Implementación de instalación de plugin obsidian-repo:
- Descarga desde GitHub releases
- Extracción en carpeta plugins/
- Detección automática de plugin
- Setup wizard inicial

Tests:
- 18 tests PASS
- Coverage: 100%

Próximo: UC-P02 - Configurar plugin"
```

---

## 🧪 EJECUTAR TESTS

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de un UC específico
npm test tests/unit/uc-{number}-{name}.test.ts

# Ejecutar tests en modo watch (durante desarrollo)
npm test -- --watch

# Ejecutar un test específico
npm test -- -t "descripción del test"

# Ejecutar con coverage
npm test -- --coverage

# Ver coverage en HTML (si está configurado)
npm test -- --coverage && open coverage/index.html
```

---

## 📝 EJEMPLO: UC-P01 (INSTALAR PLUGIN)

### Paso 1: Escribir Tests

**Archivo**: `tests/unit/uc-p01-install-plugin.test.ts`

```typescript
import { PluginInstaller } from '../../src/services/uc-p01-install-plugin';

describe('UC-P01: Instalar Plugin', () => {
  
  describe('detectReleaseUrl', () => {
    it('debe detectar URL de release correcta', () => {
      const url = PluginInstaller.detectReleaseUrl('obsidian-repo', '1.0.0');
      expect(url).toContain('github.com');
      expect(url).toContain('releases');
    });

    it('debe rechazar URL inválida', () => {
      expect(() => PluginInstaller.detectReleaseUrl('', '1.0.0')).toThrow();
    });
  });

  describe('extractZip', () => {
    it('debe extraer ZIP correctamente', async () => {
      const result = await PluginInstaller.extractZip(zipPath, targetPath);
      expect(result.success).toBe(true);
    });

    it('debe rechazar ZIP inválido', async () => {
      expect(() => PluginInstaller.extractZip('invalid', targetPath)).rejects.toThrow();
    });
  });

  describe('Integration', () => {
    it('debe completar instalación end-to-end', async () => {
      const result = await PluginInstaller.install();
      expect(result.installed).toBe(true);
    });
  });
});
```

### Paso 2: Implementación

**Archivo**: `src/services/uc-p01-install-plugin.ts`

```typescript
import { Validator } from '../utils/validators';
import { NotificationHelper } from '../utils/notificationAndVersion';

export class PluginInstaller {
  static detectReleaseUrl(pluginId: string, version: string): string {
    Validator.validateRequired(pluginId, 'Plugin ID');
    
    return `https://github.com/nestormonroy/${pluginId}/releases/download/v${version}/main.js`;
  }

  static async extractZip(zipPath: string, targetPath: string): Promise<any> {
    // Implementación mínima
    return { success: true };
  }

  static async install(): Promise<any> {
    // Implementación mínima
    return { installed: true };
  }
}
```

### Paso 3: Refactor y Documentación

```typescript
export class PluginInstaller {
  private static readonly GITHUB_BASE = 'https://github.com/nestormonroy';

  /**
   * Detectar URL de release de GitHub
   * @param pluginId ID del plugin
   * @param version Versión a descargar
   * @returns URL completa del release
   * @throws Si pluginId o version son inválidos
   */
  static detectReleaseUrl(pluginId: string, version: string): string {
    // Validar inputs
    const nameValidation = Validator.validateName(pluginId);
    if (!nameValidation.valid) throw new Error(nameValidation.error);

    // Construir URL
    return `${this.GITHUB_BASE}/${pluginId}/releases/download/v${version}/main.js`;
  }

  /**
   * Extraer ZIP a carpeta destino
   * @param zipPath Ruta del archivo ZIP
   * @param targetPath Carpeta destino
   * @returns Resultado de extracción
   */
  static async extractZip(zipPath: string, targetPath: string): Promise<any> {
    // Implementación
  }

  /**
   * Ejecutar instalación completa del plugin
   * @returns Resultado con status de instalación
   */
  static async install(): Promise<any> {
    // Implementación
  }
}
```

### Paso 4: Commit

```bash
git commit -m "FEAT: UC-P01 - Instalar plugin

Implementación de instalación de plugin obsidian-repo:
- detectReleaseUrl: Detecta URL de GitHub releases
- extractZip: Extrae archivos comprimidos
- install: Orquesta instalación completa

Tests:
- 12 tests PASS
- Coverage: 100%

Próximo: UC-P02 - Configurar plugin"
```

---

## 🎯 TIPS IMPORTANTES

### Do's ✅

- ✅ Escribir tests PRIMERO (TDD)
- ✅ Un test por caso de uso
- ✅ Nombres descriptivos en tests
- ✅ Usar arrange-act-assert
- ✅ Tests independientes
- ✅ Validar inputs
- ✅ Documentación completa

### Don'ts ❌

- ❌ Escribir tests después de código
- ❌ Tests muy grandes (una cosa por test)
- ❌ Nombres genéricos ("test1", "test2")
- ❌ Tests dependientes entre sí
- ❌ Código sin documentación
- ❌ Omitir edge cases
- ❌ Commetar código, eliminarlo

---

## 📚 REFERENCIA RÁPIDA

```typescript
// Validar
const validation = Validator.validateName(value);
if (!validation.valid) throw new Error(validation.error);

// Notificar
NotificationHelper.success('Operación completada');
NotificationHelper.error('Error en operación');

// Generar ID
import { IdGenerator, ID_TYPES } from '../utils/generateUniqueId';
const id = IdGenerator.generate(ID_TYPES.PROJECT);

// Verificar
if (!IdGenerator.isValidFormat(id)) {
  throw new Error('ID inválido');
}

// Tests básicos
expect(result).toBe(expected);         // Igualdad exacta
expect(result).toEqual(expected);      // Igualdad profunda
expect(result).toContain(item);        // Contiene
expect(() => fn()).toThrow();          // Lanza error
expect(Promise).rejects.toThrow();     // Promise rechaza
```

---

**Estado**: TEMPLATE LISTO
**Próximo UC**: UC-P01 (Instalar Plugin)
**Patrón**: TDD (Tests First → Implementación → Refactor → Commit)
