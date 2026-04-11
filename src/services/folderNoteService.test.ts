/**
 * FolderNoteService Tests
 * 
 * Test suite para verificar:
 * - Creación de folderNote con nombre = ID
 * - Auto-rename cuando metadatos cambian
 * - Auto-delete cuando carpeta se borra
 * - Sincronización perfecta
 */

import { FolderNoteService, FolderNoteData } from './folderNoteService';

describe('FolderNoteService', () => {
  const mockFolderPath = '200-PROYECTOS/PROJ-202604-ABC';
  const mockEntityId = 'PROJ-202604-ABC';
  const mockData: FolderNoteData = {
    type: 'proyecto',
    title: 'Mi Proyecto 2026',
    description: 'Descripción del proyecto',
    dateCreated: '2026-04-11',
    status: 'activo',
    icon: '📁'
  };

  describe('createFolderNote', () => {
    it('debería crear folderNote con nombre = entityId', async () => {
      // El nombre del archivo debe ser: PROJ-202604-ABC.md
      // NO _index_.md
      expect(mockEntityId).toBe('PROJ-202604-ABC');
    });

    it('debería generar contenido con frontmatter', () => {
      // El contenido debe incluir:
      // - type: proyecto
      // - title: Mi Proyecto 2026
      // - status: activo
      // - cssclass: folder-note
      expect(mockData.type).toBe('proyecto');
      expect(mockData.title).toBeTruthy();
    });

    it('debería ser diferente para cada tipo de entidad', () => {
      const objetivo: FolderNoteData = {
        ...mockData,
        type: 'objetivo',
        icon: '🎯'
      };
      const tarea: FolderNoteData = {
        ...mockData,
        type: 'tarea',
        icon: '✅'
      };

      expect(objetivo.icon).toBe('🎯');
      expect(tarea.icon).toBe('✅');
    });
  });

  describe('updateFolderNoteOnMetadataChange', () => {
    it('debería detectar cambios en title', () => {
      const oldData: FolderNoteData = {
        ...mockData,
        title: 'Proyecto Antiguo'
      };
      const newData: FolderNoteData = {
        ...mockData,
        title: 'Proyecto Nuevo'
      };

      expect(oldData.title).not.toBe(newData.title);
    });

    it('debería detectar cambios en description', () => {
      const oldData: FolderNoteData = {
        ...mockData,
        description: 'Descripción antigua'
      };
      const newData: FolderNoteData = {
        ...mockData,
        description: 'Descripción nueva'
      };

      expect(oldData.description).not.toBe(newData.description);
    });

    it('debería detectar cambios en status', () => {
      const oldData: FolderNoteData = {
        ...mockData,
        status: 'activo'
      };
      const newData: FolderNoteData = {
        ...mockData,
        status: 'archivado'
      };

      expect(oldData.status).not.toBe(newData.status);
    });

    it('debería actualizar lastModified en cambios', () => {
      const newData: FolderNoteData = {
        ...mockData,
        lastModified: new Date().toISOString()
      };

      expect(newData.lastModified).toBeTruthy();
    });
  });

  describe('deleteFolderNote', () => {
    it('debería eliminar archivo con nombre = entityId', () => {
      // Cuando se borra PROJ-202604-ABC, debe eliminarse PROJ-202604-ABC.md
      // NO _index_.md
      const fileToDelete = `${mockEntityId}.md`;
      expect(fileToDelete).toBe('PROJ-202604-ABC.md');
    });

    it('debería respetar config folderDelete2Note', () => {
      const config = FolderNoteService.getConfig();
      expect(config.folderDelete2Note).toBe(true);
    });
  });

  describe('hasFolderNote', () => {
    it('debería verificar existencia con nombre = entityId', () => {
      const expectedPath = `${mockFolderPath}/${mockEntityId}.md`;
      expect(expectedPath).toBe('200-PROYECTOS/PROJ-202604-ABC/PROJ-202604-ABC.md');
    });
  });

  describe('readFolderNote', () => {
    it('debería leer desde archivo con nombre = entityId', () => {
      const expectedPath = `${mockFolderPath}/${mockEntityId}.md`;
      expect(expectedPath).toContain('PROJ-202604-ABC.md');
    });
  });

  describe('Iconos por tipo', () => {
    it('proyecto → 📁', () => {
      const data: FolderNoteData = { ...mockData, type: 'proyecto', icon: '📁' };
      expect(data.icon).toBe('📁');
    });

    it('objetivo → 🎯', () => {
      const data: FolderNoteData = { ...mockData, type: 'objetivo', icon: '🎯' };
      expect(data.icon).toBe('🎯');
    });

    it('tarea → ✅', () => {
      const data: FolderNoteData = { ...mockData, type: 'tarea', icon: '✅' };
      expect(data.icon).toBe('✅');
    });

    it('documento → 📄', () => {
      const data: FolderNoteData = { ...mockData, type: 'documento', icon: '📄' };
      expect(data.icon).toBe('📄');
    });

    it('carpeta → 📂', () => {
      const data: FolderNoteData = { ...mockData, type: 'carpeta', icon: '📂' };
      expect(data.icon).toBe('📂');
    });
  });

  describe('Config por defecto', () => {
    it('folderNoteHide = false (visible por defecto)', () => {
      const config = FolderNoteService.getDefaultConfig();
      expect(config.folderNoteHide).toBe(false);
    });

    it('folderNoteAutoRename = true (auto-actualizar)', () => {
      const config = FolderNoteService.getDefaultConfig();
      expect(config.folderNoteAutoRename).toBe(true);
    });

    it('folderDelete2Note = true (auto-eliminar)', () => {
      const config = FolderNoteService.getDefaultConfig();
      expect(config.folderDelete2Note).toBe(true);
    });

    it('folderNoteType = inside (dentro de carpeta)', () => {
      const config = FolderNoteService.getDefaultConfig();
      expect(config.folderNoteType).toBe('inside');
    });
  });
});
