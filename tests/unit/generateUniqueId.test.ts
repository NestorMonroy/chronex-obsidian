/**
 * Tests para UC-SYS02: Generar ID Único
 */

import { IdGenerator, ID_TYPES, generateId, isValidId } from '../src/utils/generateUniqueId';

describe('UC-SYS02: IdGenerator', () => {
  describe('generate', () => {
    it('debe generar ID con formato correcto', () => {
      const id = IdGenerator.generate(ID_TYPES.PROJECT);
      expect(id).toMatch(/^PROJ-\d{6}-[A-Z0-9]{5}$/);
    });

    it('debe generar IDs únicos cada vez', () => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        ids.add(IdGenerator.generate(ID_TYPES.DOCUMENT));
      }
      
      // Todos los 100 deben ser únicos
      expect(ids.size).toBe(100);
    });

    it('debe incluir el año-mes actual', () => {
      const id = IdGenerator.generate(ID_TYPES.TASK);
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      expect(id).toContain(yearMonth);
    });

    it('debe soportar todos los tipos de ID', () => {
      Object.values(ID_TYPES).forEach(type => {
        const id = IdGenerator.generate(type);
        expect(id).toMatch(new RegExp(`^${type}-\\d{6}-[A-Z0-9]{5}$`));
      });
    });
  });

  describe('generateRandomPart', () => {
    it('debe generar parte aleatoria de longitud correcta', () => {
      const part = IdGenerator.generateRandomPart(5);
      expect(part.length).toBe(5);
    });

    it('debe soportar diferentes longitudes', () => {
      expect(IdGenerator.generateRandomPart(3).length).toBe(3);
      expect(IdGenerator.generateRandomPart(8).length).toBe(8);
      expect(IdGenerator.generateRandomPart(10).length).toBe(10);
    });

    it('debe usar solo caracteres permitidos', () => {
      const part = IdGenerator.generateRandomPart(100);
      expect(/^[A-Z0-9]+$/.test(part)).toBe(true);
    });

    it('debe generar partes diferentes cada vez', () => {
      const parts = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        parts.add(IdGenerator.generateRandomPart());
      }
      
      expect(parts.size).toBe(50);
    });
  });

  describe('generateMultiple', () => {
    it('debe generar múltiples IDs únicos', () => {
      const ids = IdGenerator.generateMultiple(ID_TYPES.OBJECTIVE, 10);
      
      expect(ids.length).toBe(10);
      expect(new Set(ids).size).toBe(10); // Todos únicos
      ids.forEach(id => {
        expect(id).toMatch(/^OBJ-\d{6}-[A-Z0-9]{5}$/);
      });
    });

    it('debe manejar cantidad = 0', () => {
      const ids = IdGenerator.generateMultiple(ID_TYPES.REPOSITORY, 0);
      expect(ids.length).toBe(0);
    });

    it('debe manejar cantidad = 1', () => {
      const ids = IdGenerator.generateMultiple(ID_TYPES.KEY_RESULT, 1);
      expect(ids.length).toBe(1);
    });
  });

  describe('isValidFormat', () => {
    it('debe validar formatos correctos', () => {
      expect(IdGenerator.isValidFormat('PROJ-202604-A1B2C')).toBe(true);
      expect(IdGenerator.isValidFormat('DOC-202604-ABC12')).toBe(true);
      expect(IdGenerator.isValidFormat('OBJ-202604-XYZ99')).toBe(true);
      expect(IdGenerator.isValidFormat('TSK-202604-00000')).toBe(true);
    });

    it('debe rechazar formatos inválidos', () => {
      expect(IdGenerator.isValidFormat('invalid')).toBe(false);
      expect(IdGenerator.isValidFormat('PROJ-2026-ABC')).toBe(false);
      expect(IdGenerator.isValidFormat('PROJ-202604-ABC')).toBe(false);
      expect(IdGenerator.isValidFormat('proj-202604-A1B2C')).toBe(false); // Minúsculas
      expect(IdGenerator.isValidFormat('PROJ-202604-abc12')).toBe(false); // Minúsculas
    });

    it('debe rechazar formato vacío', () => {
      expect(IdGenerator.isValidFormat('')).toBe(false);
    });

    it('debe rechazar formato parcial', () => {
      expect(IdGenerator.isValidFormat('PROJ-202604')).toBe(false);
      expect(IdGenerator.isValidFormat('PROJ-A1B2C')).toBe(false);
    });
  });

  describe('areAllValid', () => {
    it('debe validar que todos los IDs son válidos', () => {
      const ids = ['PROJ-202604-A1B2C', 'DOC-202604-XYZ12', 'OBJ-202604-K7M9N'];
      expect(IdGenerator.areAllValid(ids)).toBe(true);
    });

    it('debe rechazar si al menos uno es inválido', () => {
      const ids = ['PROJ-202604-A1B2C', 'invalid', 'OBJ-202604-K7M9N'];
      expect(IdGenerator.areAllValid(ids)).toBe(false);
    });

    it('debe manejar array vacío', () => {
      expect(IdGenerator.areAllValid([])).toBe(true); // Vacío = todos válidos
    });
  });

  describe('getTypeFromId', () => {
    it('debe extraer tipo correctamente', () => {
      expect(IdGenerator.getTypeFromId('PROJ-202604-A1B2C')).toBe(ID_TYPES.PROJECT);
      expect(IdGenerator.getTypeFromId('DOC-202604-ABC12')).toBe(ID_TYPES.DOCUMENT);
      expect(IdGenerator.getTypeFromId('OBJ-202604-XYZ99')).toBe(ID_TYPES.OBJECTIVE);
    });

    it('debe lanzar error si ID es inválido', () => {
      expect(() => IdGenerator.getTypeFromId('invalid')).toThrow();
    });

    it('debe lanzar error si tipo es desconocido', () => {
      expect(() => IdGenerator.getTypeFromId('UNKNOWN-202604-A1B2C')).toThrow();
    });
  });

  describe('getDateFromId', () => {
    it('debe extraer fecha de creación aproximada', () => {
      const id = 'PROJ-202604-A1B2C';
      const date = IdGenerator.getDateFromId(id);
      
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3); // 0-indexed, mes 4 (abril)
      expect(date.getDate()).toBe(1); // Primer día del mes
    });

    it('debe manejar diferentes meses', () => {
      const date1 = IdGenerator.getDateFromId('PROJ-202601-A1B2C');
      const date12 = IdGenerator.getDateFromId('PROJ-202612-A1B2C');
      
      expect(date1.getMonth()).toBe(0); // Enero
      expect(date12.getMonth()).toBe(11); // Diciembre
    });

    it('debe lanzar error si ID es inválido', () => {
      expect(() => IdGenerator.getDateFromId('invalid')).toThrow();
    });
  });

  describe('Alias functions', () => {
    it('generateId debe funcionar como atajo', () => {
      const id = generateId(ID_TYPES.TASK);
      expect(id).toMatch(/^TSK-\d{6}-[A-Z0-9]{5}$/);
    });

    it('isValidId debe funcionar como atajo', () => {
      expect(isValidId('PROJ-202604-A1B2C')).toBe(true);
      expect(isValidId('invalid')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('debe manejar fin de mes correctamente', () => {
      const ids = IdGenerator.generateMultiple(ID_TYPES.DOCUMENT, 50);
      const yearMonthSet = new Set(
        ids.map(id => id.split('-')[1])
      );
      
      // Todos deben tener el mismo año-mes (actual)
      expect(yearMonthSet.size).toBe(1);
    });

    it('debe mantener performance con generación masiva', () => {
      const startTime = Date.now();
      IdGenerator.generateMultiple(ID_TYPES.PROJECT, 1000);
      const endTime = Date.now();
      
      // Debe completarse en menos de 100ms (generación rápida)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('debe ser thread-safe en concepto (no hay race conditions)', () => {
      const ids = new Set<string>();
      
      // Simular generación concurrente (en JS es single-threaded, pero verificar lógica)
      for (let i = 0; i < 100; i++) {
        ids.add(IdGenerator.generate(ID_TYPES.DOCUMENT));
      }
      
      // Todos deben ser únicos
      expect(ids.size).toBe(100);
    });
  });

  describe('Crypto API fallback', () => {
    it('debe lanzar error si crypto API no está disponible', () => {
      // Guardar original
      const originalCrypto = window.crypto;
      
      // Simular falta de crypto
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true
      });
      
      expect(() => IdGenerator.generateRandomPart()).toThrow(
        'Web Crypto API no disponible'
      );
      
      // Restaurar
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true
      });
    });
  });
});

describe('UC-SYS02: Integration', () => {
  it('debe generar secuencia completa de IDs para un proyecto', () => {
    const projectId = IdGenerator.generate(ID_TYPES.PROJECT);
    const objectiveId = IdGenerator.generate(ID_TYPES.OBJECTIVE);
    const taskId = IdGenerator.generate(ID_TYPES.TASK);
    const docId = IdGenerator.generate(ID_TYPES.DOCUMENT);
    
    expect(IdGenerator.isValidFormat(projectId)).toBe(true);
    expect(IdGenerator.isValidFormat(objectiveId)).toBe(true);
    expect(IdGenerator.isValidFormat(taskId)).toBe(true);
    expect(IdGenerator.isValidFormat(docId)).toBe(true);
    
    // Todos deben ser únicos
    expect(new Set([projectId, objectiveId, taskId, docId]).size).toBe(4);
  });

  it('debe poder almacenar y recuperar IDs sin pérdida', () => {
    const ids = IdGenerator.generateMultiple(ID_TYPES.REPOSITORY, 10);
    
    // Almacenar en JSON (simular persistencia)
    const json = JSON.stringify(ids);
    const recovered = JSON.parse(json);
    
    expect(recovered).toEqual(ids);
    expect(IdGenerator.areAllValid(recovered)).toBe(true);
  });
});
