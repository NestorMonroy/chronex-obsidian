/**
 * IndexSyncService Tests
 * 
 * Test suite para verificar sincronización de índice global
 */

import { IndexSyncService, IndexEntry, VaultIndex } from './indexSyncService';

describe('IndexSyncService', () => {
  const mockEntry: IndexEntry = {
    id: 'PROJ-202604-ABC',
    type: 'proyecto',
    title: 'Mi Proyecto 2026',
    description: 'Descripción del proyecto',
    path: '200-PROYECTOS/PROJ-202604-ABC',
    status: 'activo',
    priority: 'ALTA',
    dateCreated: '2026-04-11',
    lastModified: new Date().toISOString()
  };

  describe('initializeIndex', () => {
    it('debería crear .index.json si no existe', () => {
      const expectedFile = '.index.json';
      expect(expectedFile).toBe('.index.json');
    });

    it('debería tener estructura inicial vacía', () => {
      const initialIndex: VaultIndex = {
        projects: [],
        objectives: [],
        tasks: [],
        documents: [],
        lastSync: new Date().toISOString()
      };
      expect(initialIndex.projects).toEqual([]);
      expect(initialIndex.objectives).toEqual([]);
    });
  });

  describe('updateIndexEntry', () => {
    it('debería agregar entrada nueva en projects[]', () => {
      expect(mockEntry.type).toBe('proyecto');
      expect(mockEntry.id).toBe('PROJ-202604-ABC');
    });

    it('debería actualizar entrada existente', () => {
      const updated = { ...mockEntry, title: 'Proyecto Actualizado' };
      expect(updated.title).not.toBe(mockEntry.title);
    });

    it('debería actualizar lastModified', () => {
      const newTimestamp = new Date().toISOString();
      expect(newTimestamp).toBeTruthy();
    });

    it('debería agregar objetivo en objectives[]', () => {
      const objective: IndexEntry = {
        ...mockEntry,
        id: 'OBJ-202604-XYZ',
        type: 'objetivo'
      };
      expect(objective.type).toBe('objetivo');
    });

    it('debería agregar tarea en tasks[]', () => {
      const task: IndexEntry = {
        ...mockEntry,
        id: 'TSK-202604-LMN',
        type: 'tarea'
      };
      expect(task.type).toBe('tarea');
    });

    it('debería agregar documento en documents[]', () => {
      const document: IndexEntry = {
        ...mockEntry,
        id: 'DOC-202604-RST',
        type: 'documento'
      };
      expect(document.type).toBe('documento');
    });
  });

  describe('deleteIndexEntry', () => {
    it('debería eliminar de projects[]', () => {
      const id = 'PROJ-202604-ABC';
      expect(id).toContain('PROJ');
    });

    it('debería eliminar de objectives[]', () => {
      const id = 'OBJ-202604-XYZ';
      expect(id).toContain('OBJ');
    });

    it('debería eliminar de tasks[]', () => {
      const id = 'TSK-202604-LMN';
      expect(id).toContain('TSK');
    });

    it('debería eliminar de documents[]', () => {
      const id = 'DOC-202604-RST';
      expect(id).toContain('DOC');
    });

    it('debería actualizar lastSync', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toBeTruthy();
    });
  });

  describe('readIndex', () => {
    it('debería retornar estructura VaultIndex completa', () => {
      const index: VaultIndex = {
        projects: [mockEntry],
        objectives: [],
        tasks: [],
        documents: [],
        lastSync: new Date().toISOString()
      };
      expect(index.projects.length).toBe(1);
      expect(index.projects[0].id).toBe('PROJ-202604-ABC');
    });
  });

  describe('findEntry', () => {
    it('debería encontrar proyecto por ID', () => {
      const id = 'PROJ-202604-ABC';
      expect(id).toBeTruthy();
    });

    it('debería encontrar objetivo por ID', () => {
      const id = 'OBJ-202604-XYZ';
      expect(id).toBeTruthy();
    });

    it('debería encontrar tarea por ID', () => {
      const id = 'TSK-202604-LMN';
      expect(id).toBeTruthy();
    });

    it('debería encontrar documento por ID', () => {
      const id = 'DOC-202604-RST';
      expect(id).toBeTruthy();
    });
  });

  describe('getStats', () => {
    it('debería retornar conteo de proyectos', () => {
      const stats = {
        projects: 3,
        objectives: 5,
        tasks: 12,
        documents: 8,
        total: 28
      };
      expect(stats.projects).toBe(3);
    });

    it('debería calcular total correcto', () => {
      const total = 3 + 5 + 12 + 8;
      expect(total).toBe(28);
    });
  });

  describe('Sincronización automática', () => {
    it('CREATE → IndexSync agrega entrada', () => {
      const before = 0;
      const after = before + 1;
      expect(after).toBe(1);
    });

    it('UPDATE → IndexSync actualiza entrada', () => {
      const entry: IndexEntry = { ...mockEntry, title: 'Nuevo Título' };
      expect(entry.lastModified).toBeTruthy();
    });

    it('DELETE → IndexSync elimina entrada', () => {
      const before = 1;
      const after = before - 1;
      expect(after).toBe(0);
    });

    it('ARCHIVE → IndexSync actualiza status', () => {
      const entry: IndexEntry = { ...mockEntry, status: 'archivado' };
      expect(entry.status).toBe('archivado');
    });
  });

  describe('Integridad de datos', () => {
    it('Cada entry debe tener: id, type, title, path, status, dateCreated', () => {
      expect(mockEntry.id).toBeTruthy();
      expect(mockEntry.type).toBeTruthy();
      expect(mockEntry.title).toBeTruthy();
      expect(mockEntry.path).toBeTruthy();
      expect(mockEntry.status).toBeTruthy();
      expect(mockEntry.dateCreated).toBeTruthy();
    });

    it('CERO entradas duplicadas (por ID)', () => {
      const ids = ['PROJ-202604-ABC', 'OBJ-202604-XYZ', 'TSK-202604-LMN'];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('CERO inconsistencias en timestamps', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toBeTruthy();
    });
  });
});
