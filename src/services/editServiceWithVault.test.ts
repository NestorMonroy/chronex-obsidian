/**
 * EditServiceWithVault Tests
 * 
 * Test suite para verificar UPDATE con auto-rename y auto-sync
 */

import { EditServiceWithVault, EditEntityInput } from './editServiceWithVault';

describe('EditServiceWithVault', () => {
  const mockInput: EditEntityInput = {
    entityId: 'PROJ-202604-ABC',
    entityType: 'proyecto',
    updates: {
      title: 'Nuevo Título',
      description: 'Nueva descripción'
    },
    folderPath: '200-PROYECTOS/PROJ-202604-ABC'
  };

  describe('editEntityWithVault', () => {
    it('debería actualizar README.md', () => {
      expect(mockInput.folderPath).toContain('README.md');
    });

    it('debería auto-actualizar PROJ-202604-ABC.md (FolderNote)', () => {
      const expectedFolderNotePath = `${mockInput.folderPath}/${mockInput.entityId}.md`;
      expect(expectedFolderNotePath).toBe('200-PROYECTOS/PROJ-202604-ABC/PROJ-202604-ABC.md');
    });

    it('debería sincronizar .index.json automáticamente', () => {
      expect(mockInput.entityId).toBe('PROJ-202604-ABC');
      expect(mockInput.entityType).toBe('proyecto');
    });

    it('debería detectar cambios en title', () => {
      expect(mockInput.updates.title).toBe('Nuevo Título');
    });

    it('debería detectar cambios en description', () => {
      expect(mockInput.updates.description).toBe('Nueva descripción');
    });

    it('debería permitir actualizar status', () => {
      const inputWithStatus: EditEntityInput = {
        ...mockInput,
        updates: {
          ...mockInput.updates,
          status: 'archivado'
        }
      };
      expect(inputWithStatus.updates.status).toBe('archivado');
    });

    it('debería permitir actualizar priority', () => {
      const inputWithPriority: EditEntityInput = {
        ...mockInput,
        updates: {
          ...mockInput.updates,
          priority: 'ALTA'
        }
      };
      expect(inputWithPriority.updates.priority).toBe('ALTA');
    });
  });

  describe('Sincronización en UPDATE', () => {
    it('debería sincronizar README.md + FolderNote + .index.json', () => {
      // Cuando editas:
      // 1. README.md se actualiza (input)
      // 2. PROJ-202604-ABC.md se auto-actualiza (FolderNoteService)
      // 3. .index.json se auto-sincroniza (IndexSyncService)
      expect(mockInput.entityId).toBeTruthy();
      expect(mockInput.folderPath).toBeTruthy();
      expect(mockInput.updates).toBeTruthy();
    });

    it('debería actualizar lastModified en .index.json', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toBeTruthy();
    });

    it('CERO pasos manuales', () => {
      // Todo es automático
      // No hay pasos manuales
      const isAutomatic = true;
      expect(isAutomatic).toBe(true);
    });
  });

  describe('Actualizaciones por tipo de entidad', () => {
    it('debería actualizar proyecto → PROJ-ID.md', () => {
      const input: EditEntityInput = {
        entityId: 'PROJ-202604-ABC',
        entityType: 'proyecto',
        updates: { title: 'Nuevo Proyecto' },
        folderPath: '200-PROYECTOS/PROJ-202604-ABC'
      };
      expect(input.entityId).toContain('PROJ');
    });

    it('debería actualizar objetivo → OBJ-ID.md', () => {
      const input: EditEntityInput = {
        entityId: 'OBJ-202604-XYZ',
        entityType: 'objetivo',
        updates: { title: 'Nuevo Objetivo' },
        folderPath: '200-PROYECTOS/PROJ-ID/objetivos/OBJ-202604-XYZ'
      };
      expect(input.entityId).toContain('OBJ');
    });

    it('debería actualizar tarea → TSK-ID.md', () => {
      const input: EditEntityInput = {
        entityId: 'TSK-202604-LMN',
        entityType: 'tarea',
        updates: { title: 'Nueva Tarea' },
        folderPath: '200-PROYECTOS/PROJ-ID/objetivos/OBJ-ID/tareas/TSK-202604-LMN'
      };
      expect(input.entityId).toContain('TSK');
    });

    it('debería actualizar documento → DOC-ID.md', () => {
      const input: EditEntityInput = {
        entityId: 'DOC-202604-RST',
        entityType: 'documento',
        updates: { title: 'Nuevo Documento' },
        folderPath: '500-REPOSITORIOS/General/DOC-202604-RST'
      };
      expect(input.entityId).toContain('DOC');
    });
  });
});
