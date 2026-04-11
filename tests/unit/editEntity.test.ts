/**
 * Tests para UC-019: Edit Entity (TIER 1 MVP)
 */

import { EditService, EditEntityInput, EditResult } from '../../src/services/editEntity';

describe('UC-019: Edit Entity', () => {
  
  describe('editProject', () => {
    beforeEach(() => {
      EditService.registerProject('PROJ-202604-ABC12', { projectName: 'Test', description: 'Test' });
      EditService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
      EditService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
    });

    it('debe editar proyecto correctamente', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: {
          projectName: 'Nombre Actualizado',
          description: 'Nueva descripción'
        }
      };

      const result = await EditService.editProject(input);
      expect(result.success).toBe(true);
    });

    it('debe validar que entityId existe', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-999999-ZZZZZ',
        updates: { projectName: 'Test' }
      };

      await expect(EditService.editProject(input)).rejects.toThrow();
    });

    it('debe actualizar solo campos proporcionados', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: { priority: 'ALTA' }
      };

      const result = await EditService.editProject(input);
      expect(result.success).toBe(true);
      expect(result.updated).toContain('priority');
    });

    it('debe retornar lista de campos actualizados', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: {
          projectName: 'Nuevo',
          description: 'Desc',
          priority: 'ALTA'
        }
      };

      const result = await EditService.editProject(input);
      expect(result.updated).toBeInstanceOf(Array);
      expect(result.updated?.length).toBe(3);
    });
  });

  describe('editObjective', () => {
    beforeEach(() => {
      EditService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
    });

    it('debe editar objetivo correctamente', async () => {
      const input: EditEntityInput = {
        entityId: 'OBJ-202604-ABC12',
        updates: { objectiveName: 'Objetivo Actualizado' }
      };

      const result = await EditService.editObjective(input);
      expect(result.success).toBe(true);
    });
  });

  describe('editTask', () => {
    beforeEach(() => {
      EditService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
    });

    it('debe editar tarea correctamente', async () => {
      const input: EditEntityInput = {
        entityId: 'TSK-202604-ABC12',
        updates: { taskName: 'Tarea Actualizada', priority: 'CRÍTICA' }
      };

      const result = await EditService.editTask(input);
      expect(result.success).toBe(true);
    });

    it('debe permitir actualizar dueDate', async () => {
      const input: EditEntityInput = {
        entityId: 'TSK-202604-ABC12',
        updates: { dueDate: '2026-05-15' }
      };

      const result = await EditService.editTask(input);
      expect(result.success).toBe(true);
    });
  });

  describe('validateUpdates', () => {
    it('debe validar que updates no esté vacío', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: {}
      };

      await expect(EditService.editProject(input)).rejects.toThrow();
    });

    it('debe rechazar campos inválidos', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: { invalidField: 'value' }
      };

      await expect(EditService.editProject(input)).rejects.toThrow();
    });
  });

  describe('Integration: Full Edit Flow', () => {
    it('debe completar flujo de edición end-to-end', async () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC12',
        updates: {
          projectName: 'Proyecto Editado',
          description: 'Descripción actualizada',
          priority: 'ALTA'
        }
      };

      const result = await EditService.editProject(input);

      expect(result.success).toBe(true);
      expect(result.entityId).toBe('PROJ-202604-ABC12');
      expect(result.updated).toContain('projectName');
      expect(result.updated).toContain('description');
      expect(result.updated).toContain('priority');
    });
  });
});
