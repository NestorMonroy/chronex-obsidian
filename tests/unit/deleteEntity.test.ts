/**
 * Tests para UC-020: Delete Entity (TIER 1 MVP)
 */

import { DeleteService, DeleteResult } from '../../src/services/deleteEntity';

describe('UC-020: Delete Entity', () => {
  
  describe('deleteProject', () => {
    beforeEach(() => {
      DeleteService.registerProject('PROJ-202604-ABC12', { projectName: 'Test' });
      DeleteService.registerProject('PROJ-202604-TEST', { projectName: 'Test' });
      DeleteService.registerProject('PROJ-202604-DELETE', { projectName: 'Test' });
      DeleteService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
      DeleteService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
    });

    it('debe eliminar proyecto correctamente', async () => {
      const result = await DeleteService.deleteProject('PROJ-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.entityId).toBe('PROJ-202604-ABC12');
    });

    it('debe validar que proyecto existe', async () => {
      await expect(DeleteService.deleteProject('PROJ-999999-ZZZZZ')).rejects.toThrow();
    });

    it('debe retornar información de eliminación', async () => {
      const result = await DeleteService.deleteProject('PROJ-202604-TEST');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('entityId');
      expect(result).toHaveProperty('message');
    });
  });

  describe('deleteObjective', () => {
    beforeEach(() => {
      DeleteService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
    });

    it('debe eliminar objetivo correctamente', async () => {
      const result = await DeleteService.deleteObjective('OBJ-202604-ABC12');
      expect(result.success).toBe(true);
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      DeleteService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
      DeleteService.registerTask('TSK-202604-DELETE', { taskName: 'Test' });
    });

    it('debe eliminar tarea correctamente', async () => {
      const result = await DeleteService.deleteTask('TSK-202604-ABC12');
      expect(result.success).toBe(true);
    });

    it('debe validar que tarea existe', async () => {
      await expect(DeleteService.deleteTask('TSK-999999-ZZZZZ')).rejects.toThrow();
    });
  });

  describe('Integration: Full Delete Flow', () => {
    it('debe completar flujo de eliminación end-to-end', async () => {
      const result = await DeleteService.deleteProject('PROJ-202604-DELETE');
      expect(result.success).toBe(true);
      expect(result.message).toContain('eliminado');
    });
  });
});
