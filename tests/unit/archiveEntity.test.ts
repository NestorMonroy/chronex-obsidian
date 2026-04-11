/**
 * Tests para UC-021: Archive Entity (TIER 1 MVP)
 */

import { ArchiveService, ArchiveResult } from '../../src/services/archiveEntity';

describe('UC-021: Archive Entity', () => {
  
  describe('archiveProject', () => {
    beforeEach(() => {
      ArchiveService.registerProject('PROJ-202604-ABC12', { projectName: 'Test' });
      ArchiveService.registerProject('PROJ-202604-TEST', { projectName: 'Test' });
      ArchiveService.registerProject('PROJ-202604-ARCH', { projectName: 'Test' });
      ArchiveService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
      ArchiveService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
    });

    it('debe archivar proyecto correctamente', async () => {
      const result = await ArchiveService.archiveProject('PROJ-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.status).toBe('archivado');
    });

    it('debe validar que proyecto existe', async () => {
      await expect(ArchiveService.archiveProject('PROJ-999999-ZZZZZ')).rejects.toThrow();
    });

    it('debe retornar información de archivo', async () => {
      const result = await ArchiveService.archiveProject('PROJ-202604-TEST');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('archivedDate');
    });
  });

  describe('unarchiveProject', () => {
    beforeEach(() => {
      ArchiveService.registerProject('PROJ-202604-ABC12', { projectName: 'Test' });
    });

    it('debe desarchivar proyecto correctamente', async () => {
      await ArchiveService.archiveProject('PROJ-202604-ABC12');
      const result = await ArchiveService.unarchiveProject('PROJ-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.status).toBe('activo');
    });
  });

  describe('archiveObjective', () => {
    beforeEach(() => {
      ArchiveService.registerObjective('OBJ-202604-ABC12', { objectiveName: 'Test' });
    });

    it('debe archivar objetivo correctamente', async () => {
      const result = await ArchiveService.archiveObjective('OBJ-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.status).toBe('archivado');
    });
  });

  describe('archiveTask', () => {
    beforeEach(() => {
      ArchiveService.registerTask('TSK-202604-ABC12', { taskName: 'Test' });
      ArchiveService.registerTask('TSK-202604-ARCH', { taskName: 'Test' });
    });

    it('debe archivar tarea correctamente', async () => {
      const result = await ArchiveService.archiveTask('TSK-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.status).toBe('archivado');
    });

    it('debe permitir desarchivación', async () => {
      await ArchiveService.archiveTask('TSK-202604-ABC12');
      const result = await ArchiveService.unarchiveTask('TSK-202604-ABC12');
      expect(result.success).toBe(true);
      expect(result.status).toBe('pendiente');
    });
  });

  describe('Integration: Full Archive Flow', () => {
    it('debe completar flujo de archivo end-to-end', async () => {
      const archiveResult = await ArchiveService.archiveProject('PROJ-202604-ARCH');
      expect(archiveResult.success).toBe(true);
      expect(archiveResult.status).toBe('archivado');
      expect(archiveResult.archivedDate).toBeDefined();

      const unarchiveResult = await ArchiveService.unarchiveProject('PROJ-202604-ARCH');
      expect(unarchiveResult.success).toBe(true);
      expect(unarchiveResult.status).toBe('activo');
    });
  });
});
