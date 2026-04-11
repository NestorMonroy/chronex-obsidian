/**
 * Tests para generateUniqueId.js
 * FASE 2: Módulo utilities reutilizable
 * 
 * @file generateUniqueId.test.js
 * @version 1.0.0
 */

import { generateUniqueId } from '../../src/utils/generateUniqueId.js';

describe('generateUniqueId', () => {
  
  // GRUPO 1: Generación básica
  describe('Generación básica', () => {
    test('Debe generar un ID válido', () => {
      const id = generateUniqueId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
    
    test('Debe generar IDs diferentes en llamadas consecutivas', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });

    test('Debe generar IDs diferentes en múltiples llamadas', () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(generateUniqueId());
      }
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });
  
  // GRUPO 2: Formato de ID
  describe('Formato de ID', () => {
    test('Debe incluir el prefijo "id-"', () => {
      const id = generateUniqueId();
      expect(id).toMatch(/^id-/);
    });

    test('Debe tener al menos 3 partes separadas por guiones', () => {
      const id = generateUniqueId();
      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe('id');
    });
    
    test('Debe incluir timestamp (segunda parte)', () => {
      const id = generateUniqueId();
      const parts = id.split('-');
      const timestamp = parseInt(parts[1], 10);
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });

    test('Debe incluir componente aleatorio hexadecimal', () => {
      const id = generateUniqueId();
      const parts = id.split('-');
      const randomPart = parts[parts.length - 1];
      expect(randomPart).toMatch(/^[0-9a-f]+$/i);
      expect(randomPart.length).toBeGreaterThan(0);
    });

    test('Debe contener solo caracteres válidos', () => {
      const id = generateUniqueId();
      expect(id).toMatch(/^[a-z0-9\-]+$/i);
    });
  });
  
  // GRUPO 3: Propiedades
  describe('Propiedades', () => {
    test('Debe retornar string', () => {
      const id = generateUniqueId();
      expect(typeof id).toBe('string');
    });

    test('Debe generar IDs de longitud consistente', () => {
      const ids = [];
      for (let i = 0; i < 5; i++) {
        ids.push(generateUniqueId());
      }
      const lengths = ids.map(id => id.length);
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
    });

    test('Debe aceptar opciones para prefijo personalizado', () => {
      const id = generateUniqueId({ prefix: 'custom' });
      expect(id).toMatch(/^custom-/);
    });
  });
});
