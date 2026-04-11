/**
 * Tests para UC-010: Create Objective (TIER 1 MVP)
 */

import { ObjectiveService, CreateObjectiveInput, ObjectiveResult } from '../../src/services/createObjective';

describe('UC-010: Create Objective (TIER 1 MVP)', () => {
  
  describe('createObjective', () => {
    it('debe crear objetivo correctamente', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Mi Objetivo',
        description: 'Descripción del objetivo',
        priority: 'MEDIA'
      };

      const result = await ObjectiveService.createObjective(input);

      expect(result.success).toBe(true);
      expect(result.objectiveId).toBeDefined();
      expect(result.objectiveId).toMatch(/^OBJ-\d{6}-[A-Z0-9]{5}$/);
    });

    it('debe validar que objectiveName no esté vacío', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: '',
        description: 'Test'
      };

      await expect(ObjectiveService.createObjective(input)).rejects.toThrow();
    });

    it('debe permitir description vacía', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Objetivo Sin Descripción',
        description: ''
      };

      const result = await ObjectiveService.createObjective(input);
      expect(result.success).toBe(true);
    });

    it('debe validar priority si se proporciona', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Test',
        description: 'Test',
        priority: 'ALTA'
      };

      const result = await ObjectiveService.createObjective(input);
      expect(result.success).toBe(true);
    });

    it('debe rechazar priority inválida', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Test',
        description: 'Test',
        priority: 'INVALIDA'
      };

      await expect(ObjectiveService.createObjective(input)).rejects.toThrow();
    });

    it('debe crear nota base del objetivo', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Nota Test',
        description: 'Test'
      };

      const result = await ObjectiveService.createObjective(input);

      expect(result.noteCreated).toBe(true);
      expect(result.notePath).toBeDefined();
    });

    it('debe crear frontmatter completo', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Frontmatter Test',
        description: 'Test description',
        priority: 'ALTA'
      };

      const result = await ObjectiveService.createObjective(input);

      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter?.uid).toBe(result.objectiveId);
      expect(result.frontmatter?.type).toBe('objetivo');
    });

    it('debe retornar información completa', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Completo Test',
        description: 'Test'
      };

      const result = await ObjectiveService.createObjective(input);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('objectiveId');
      expect(result).toHaveProperty('noteCreated');
      expect(result).toHaveProperty('frontmatter');
    });
  });

  describe('getObjective', () => {
    it('debe obtener objetivo por ID', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Get Test',
        description: 'Test'
      };

      const created = await ObjectiveService.createObjective(input);
      const result = await ObjectiveService.getObjective(created.objectiveId!);

      expect(result).toBeDefined();
      expect(result?.objectiveName).toBe('Get Test');
    });

    it('debe retornar null si objetivo no existe', async () => {
      const result = await ObjectiveService.getObjective('OBJ-999999-ZZZZZ');
      expect(result).toBeNull();
    });
  });

  describe('listObjectives', () => {
    it('debe listar objetivos creados', async () => {
      const input1: CreateObjectiveInput = {
        objectiveName: 'List Objective 1',
        description: 'Test'
      };

      const input2: CreateObjectiveInput = {
        objectiveName: 'List Objective 2',
        description: 'Test'
      };

      await ObjectiveService.createObjective(input1);
      await ObjectiveService.createObjective(input2);

      const objectives = await ObjectiveService.listObjectives();

      expect(objectives).toBeInstanceOf(Array);
      expect(objectives.length).toBeGreaterThanOrEqual(2);
    });

    it('debe retornar array vacío si no hay objetivos', async () => {
      const objectives = await ObjectiveService.listObjectives();
      expect(Array.isArray(objectives)).toBe(true);
    });
  });

  describe('validateObjectiveInput', () => {
    it('debe validar entrada correcta', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Valid Objective',
        description: 'Valid description'
      };

      const result = await ObjectiveService.validateObjectiveInput(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe validar que objectiveName es requerido', async () => {
      const input: any = {
        description: 'Test'
      };

      const result = await ObjectiveService.validateObjectiveInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar nombres muy largos', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'A'.repeat(200),
        description: 'Test'
      };

      const result = await ObjectiveService.createObjective(input);
      expect(result.success).toBe(true);
    });

    it('debe soportar caracteres especiales', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'Objetivo 2026 (Especial) [Beta]',
        description: 'Test'
      };

      const result = await ObjectiveService.createObjective(input);
      expect(result.success).toBe(true);
    });

    it('debe soportar múltiples prioridades', async () => {
      const priorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
      const results = [];

      for (const priority of priorities) {
        const input: CreateObjectiveInput = {
          objectiveName: `Priority ${priority}`,
          description: 'Test',
          priority
        };
        const result = await ObjectiveService.createObjective(input);
        results.push(result.success);
      }

      expect(results).toEqual([true, true, true, true]);
    });
  });

  describe('Integration: Complete Objective Creation', () => {
    it('debe completar flujo end-to-end', async () => {
      const input: CreateObjectiveInput = {
        objectiveName: 'E2E Objetivo',
        description: 'Test completo',
        priority: 'ALTA'
      };

      const result = await ObjectiveService.createObjective(input);

      expect(result.success).toBe(true);
      expect(result.objectiveId).toBeDefined();
      expect(result.noteCreated).toBe(true);
      expect(result.frontmatter).toBeDefined();

      const retrieved = await ObjectiveService.getObjective(result.objectiveId!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.objectiveName).toBe('E2E Objetivo');
    });
  });
});
