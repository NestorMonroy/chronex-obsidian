/**
 * Tests para validateCommonInput.js
 * FASE 2: Módulo utilities reutilizable
 * 
 * @file validateCommonInput.test.js
 * @version 1.0.0
 */

import { validateCommonInput } from '../../src/utils/validateCommonInput.js';

describe('validateCommonInput', () => {
  
  // GRUPO 1: Entrada válida
  describe('Entrada válida', () => {
    test('Debe aceptar cadena válida simple', () => {
      const result = validateCommonInput('Mi Proyecto');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('Debe aceptar longitud mínima exacta (3 caracteres)', () => {
      const result = validateCommonInput('abc');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('Debe aceptar longitud máxima exacta (255 caracteres)', () => {
      const input = 'a'.repeat(255);
      const result = validateCommonInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('Debe aceptar entrada con números', () => {
      const result = validateCommonInput('Proyecto 2025');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('Debe aceptar entrada con guiones', () => {
      const result = validateCommonInput('My-Project-Name');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Debe aceptar entrada con guiones bajos', () => {
      const result = validateCommonInput('my_project_name');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  // GRUPO 2: Entrada inválida
  describe('Entrada inválida', () => {
    test('Debe rechazar entrada vacía', () => {
      const result = validateCommonInput('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].toLowerCase()).toMatch(/vacío|empty|blank/);
    });
    
    test('Debe rechazar null', () => {
      const result = validateCommonInput(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('Debe rechazar undefined', () => {
      const result = validateCommonInput(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Debe rechazar número', () => {
      const result = validateCommonInput(123);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Debe rechazar entrada menor a 3 caracteres', () => {
      const result = validateCommonInput('ab');
      expect(result.isValid).toBe(false);
      const errorMsg = result.errors.join(' ').toLowerCase();
      expect(errorMsg).toMatch(/mínimo|minimum|3/);
    });

    test('Debe rechazar entrada mayor a 255 caracteres', () => {
      const input = 'a'.repeat(256);
      const result = validateCommonInput(input);
      expect(result.isValid).toBe(false);
      const errorMsg = result.errors.join(' ').toLowerCase();
      expect(errorMsg).toMatch(/máximo|maximum|255/);
    });

    test('Debe rechazar caracteres especiales inválidos', () => {
      const result = validateCommonInput('Mi Proyecto @#$');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const errorMsg = result.errors.join(' ').toLowerCase();
      expect(errorMsg).toMatch(/carácter|character|inválido|invalid/);
    });
  });
  
  // GRUPO 3: Edge cases
  describe('Edge cases', () => {
    test('Debe manejar espacios múltiples', () => {
      const result = validateCommonInput('Mi   Proyecto   Grande');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Debe manejar solo espacios (menor a 3 caracteres)', () => {
      const result = validateCommonInput('   ');
      expect(result.isValid).toBe(false);
    });
  });
});
