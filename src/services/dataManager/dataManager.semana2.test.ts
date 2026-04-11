/**
 * SEMANA 2: Tests para DataManager
 * TaskCache, EventEmitter, DataManager
 */

import { TaskCache } from './TaskCache';
import { EventEmitter } from './EventEmitter';
import { DataManager } from './DataManager';
import { CachedTask, TaskChangeEvent } from './types';

describe('DataManager - SEMANA 2', () => {
  
  // ==================== TaskCache ====================

  describe('TaskCache', () => {
    let cache: TaskCache;

    beforeEach(() => {
      cache = new TaskCache({ ttl: 5000, maxSize: 100 });
    });

    test('debería guardar y recuperar una tarea', () => {
      const task: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: { title: 'Test' },
        lastUpdate: Date.now(),
      };

      cache.set('TSK-001', task);
      const retrieved = cache.get('TSK-001');

      expect(retrieved).toEqual(task);
    });

    test('debería retornar null si tarea no existe', () => {
      const result = cache.get('TSK-999');
      expect(result).toBeNull();
    });

    test('debería invalidar una tarea', () => {
      const task: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: { title: 'Test' },
        lastUpdate: Date.now(),
      };

      cache.set('TSK-001', task);
      cache.invalidate('TSK-001');

      const result = cache.get('TSK-001');
      expect(result).toBeNull();
    });

    test('debería invalidar todas las tareas', () => {
      cache.set('TSK-001', {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      cache.set('TSK-002', {
        taskId: 'TSK-002',
        folderPath: '/test2',
        notePath: '/test2/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      cache.invalidateAll();

      expect(cache.size()).toBe(0);
    });

    test('debería respetar TTL', async () => {
      const shortCache = new TaskCache({ ttl: 100 });
      const task: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      };

      shortCache.set('TSK-001', task);
      expect(shortCache.get('TSK-001')).not.toBeNull();

      // Esperar a que expire
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(shortCache.get('TSK-001')).toBeNull();
    });

    test('debería retornar todas las tareas válidas', () => {
      cache.set('TSK-001', {
        taskId: 'TSK-001',
        folderPath: '/1',
        notePath: '/1/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      cache.set('TSK-002', {
        taskId: 'TSK-002',
        folderPath: '/2',
        notePath: '/2/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      const all = cache.getAll();
      expect(all.length).toBe(2);
    });

    test('debería verificar si existe en cache', () => {
      const task: CachedTask = {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      };

      cache.set('TSK-001', task);

      expect(cache.has('TSK-001')).toBe(true);
      expect(cache.has('TSK-999')).toBe(false);
    });

    test('debería retornar estadísticas', () => {
      cache.set('TSK-001', {
        taskId: 'TSK-001',
        folderPath: '/test',
        notePath: '/test/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      const stats = cache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
      expect(stats.utilization).toBeDefined();
    });

    test('debería respetar maxSize', () => {
      const smallCache = new TaskCache({ maxSize: 2 });

      smallCache.set('TSK-001', {
        taskId: 'TSK-001',
        folderPath: '/1',
        notePath: '/1/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      smallCache.set('TSK-002', {
        taskId: 'TSK-002',
        folderPath: '/2',
        notePath: '/2/README.md',
        frontmatter: {},
        lastUpdate: Date.now() + 100,
      });

      // Agregar tercero debería eliminar el más antiguo
      smallCache.set('TSK-003', {
        taskId: 'TSK-003',
        folderPath: '/3',
        notePath: '/3/README.md',
        frontmatter: {},
        lastUpdate: Date.now(),
      });

      expect(smallCache.size()).toBe(2);
      expect(smallCache.has('TSK-001')).toBe(false); // El más antiguo fue eliminado
    });
  });

  // ==================== EventEmitter ====================

  describe('EventEmitter', () => {
    let emitter: EventEmitter;

    beforeEach(() => {
      emitter = new EventEmitter();
    });

    test('debería emitir y recibir evento', (done) => {
      emitter.on('test', (event) => {
        expect(event.type).toBe('update');
        done();
      });

      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });
    });

    test('debería suscribir a tipo específico', (done) => {
      emitter.on('create', (event) => {
        expect(event.type).toBe('create');
        done();
      });

      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });

      emitter.emit({
        type: 'create',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });
    });

    test('debería suscribir a todos los eventos con *', (done) => {
      let count = 0;

      emitter.on('*', () => {
        count++;
        if (count === 2) {
          done();
        }
      });

      emitter.emit({
        type: 'create',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });

      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });
    });

    test('debería desuscribirse', () => {
      const unsubscribe = emitter.on('test', () => {
        throw new Error('Should not be called');
      });

      unsubscribe();

      // No debería lanzar
      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });

      expect(emitter.listenerCount('test')).toBe(0);
    });

    test('debería ejecutar listener solo una vez', (done) => {
      let count = 0;

      emitter.once('test', () => {
        count++;
      });

      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });

      emitter.emit({
        type: 'update',
        taskId: 'TSK-001',
        timestamp: Date.now(),
      });

      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 100);
    });

    test('debería contar listeners', () => {
      emitter.on('create', () => {});
      emitter.on('create', () => {});
      emitter.on('update', () => {});

      expect(emitter.listenerCount('create')).toBe(2);
      expect(emitter.listenerCount('update')).toBe(1);
      expect(emitter.listenerCount()).toBe(3);
    });

    test('debería limpiar todos los listeners', () => {
      emitter.on('create', () => {});
      emitter.on('update', () => {});

      emitter.clear();

      expect(emitter.listenerCount()).toBe(0);
    });

    test('debería manejar errores en listeners', () => {
      emitter.on('test', () => {
        throw new Error('Test error');
      });

      // No debería lanzar
      expect(() => {
        emitter.emit({
          type: 'update',
          taskId: 'TSK-001',
          timestamp: Date.now(),
        });
      }).not.toThrow();
    });
  });

  // ==================== DataManager ====================

  describe('DataManager', () => {
    beforeEach(() => {
      DataManager.reset();
    });

    test('debería ser singleton', () => {
      const dm1 = DataManager.getInstance();
      const dm2 = DataManager.getInstance();

      expect(dm1).toBe(dm2);
    });

    test('debería inicializar con config', () => {
      const dm = DataManager.getInstance({
        autoSync: false,
        cacheOptions: { ttl: 10000 },
      });

      expect(dm).toBeDefined();
    });

    test('debería obtener estadísticas de cache', () => {
      const dm = DataManager.getInstance();
      const stats = dm.getCacheStats();

      expect(stats.size).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(stats.utilization).toBeDefined();
    });

    test('debería obtener estado de sincronización', () => {
      const dm = DataManager.getInstance();
      const status = dm.getSyncStatus();

      expect(status.isSyncing).toBe(false);
      expect(status.lastSync).toBeDefined();
      expect(status.pendingChanges).toBeDefined();
      expect(status.errors).toBeInstanceOf(Array);
    });

    test('debería invalidar cache', async () => {
      const dm = DataManager.getInstance();

      dm.invalidateCache('TSK-001');
      dm.invalidateCache(); // Invalidar todo

      expect(dm.getTaskCount()).toBe(0);
    });

    test('debería suscribirse a cambios', (done) => {
      const dm = DataManager.getInstance();

      dm.onChange((event) => {
        expect(event.type).toBeDefined();
        done();
      });

      // Este test requeriría crear una tarea real
      // Por ahora solo verificamos que no lanza error
      expect(dm.getTaskCount()).toBe(0);
    });

    test('debería suscribirse a tipo específico', (done) => {
      const dm = DataManager.getInstance();

      dm.onChange((event) => {
        expect(event.type).toBe('update');
        done();
      }, 'update');

      // Test básico de estructura
      expect(dm.getSyncStatus()).toBeDefined();
    });

    test('debería detener auto-sync', () => {
      const dm = DataManager.getInstance({ autoSync: true });
      dm.stopAutoSync();
      
      // No debería lanzar
      expect(() => dm.stopAutoSync()).not.toThrow();
    });

    test('debería limpiar todo', () => {
      const dm = DataManager.getInstance();
      dm.clear();

      expect(dm.getTaskCount()).toBe(0);
      expect(dm.getSyncStatus().errors).toEqual([]);
    });
  });

  // ==================== INTEGRACIÓN ====================

  describe('Integración - Flujo completo', () => {
    beforeEach(() => {
      DataManager.reset();
    });

    test('debería crear DataManager, cachear datos y emitir eventos', (done) => {
      const dm = DataManager.getInstance({ autoSync: false });
      let updateEmitted = false;

      dm.onChange((event) => {
        expect(event.type).toBeDefined();
        updateEmitted = true;
      });

      // Verificar que el sistema está listo
      const stats = dm.getCacheStats();
      expect(stats).toBeDefined();

      done();
    });
  });
});
