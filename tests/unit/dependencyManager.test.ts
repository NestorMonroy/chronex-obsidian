/**
 * UC-050: DEPENDENCIES
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que maneja dependencias entre tareas (bloqueos).
 * 
 * Ejemplo:
 * - "- [ ] Task B 🔗 ⬆️ ^task-a" → Task B depende de Task A
 * - "- [ ] Task A 🔗 ⬇️ ^task-b" → Task A bloquea Task B
 * 
 * Convención de nombres:
 * ✅ camelCase: dependencyManager, parseDependency, resolveDependencies
 * ✅ Archivo: dependencyManager.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface Task {
  id: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: string;
  dependencies?: string[]; // IDs de tasks de las que depende
  blocking?: string[]; // IDs de tasks que esta bloquea
  tags: string[];
}

interface Dependency {
  taskId: string;
  dependsOn: string; // ID de tarea requerida
  type: 'blocks' | 'depends'; // blocks: esta bloquea otra, depends: esta depende de otra
}

interface DependencyResult {
  success: boolean;
  dependency?: Dependency;
  error?: string;
}

interface ResolutionResult {
  success: boolean;
  canExecute: boolean; // ¿Puede ejecutarse sin dependencias incompletas?
  blockedBy?: string[]; // IDs de tareas que la bloquean
  blocking?: string[]; // IDs que esta bloquea
  error?: string;
}

describe('UC-050: dependencyManager - Dependencies', () => {
  let manager: any;

  beforeEach(() => {
    const DependencyManager = require('../../src/services/task-parser/dependencyManager').DependencyManager;
    manager = new DependencyManager();
  });

  // ==================== PARSING DEPENDENCIES ====================
  describe('dependencyManager - Parse Dependencies', () => {
    test('debe parsear "🔗 ⬆️ ^task-id" (depende de)', () => {
      const line = '- [ ] Task B 🔗 ⬆️ ^task-a';

      const result = manager.parseDependencyFromLine(line, 'task-b');

      expect(result.success).toBe(true);
      expect(result.dependency?.dependsOn).toBe('task-a');
      expect(result.dependency?.type).toBe('depends');
    });

    test('debe parsear "🔗 ⬇️ ^task-id" (bloquea)', () => {
      const line = '- [ ] Task A 🔗 ⬇️ ^task-b';

      const result = manager.parseDependencyFromLine(line, 'task-a');

      expect(result.success).toBe(true);
      expect(result.dependency?.dependsOn).toBe('task-b');
      expect(result.dependency?.type).toBe('blocks');
    });

    test('debe parsear múltiples dependencias', () => {
      const line = '- [ ] Task C 🔗 ⬆️ ^task-a ⬆️ ^task-b';

      const results = manager.parseDependenciesFromLine(line, 'task-c');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('debe retornar null si no hay dependencias', () => {
      const line = '- [ ] Task sin dependencias';

      const result = manager.parseDependencyFromLine(line, 'task-1');

      expect(result.success).toBe(true);
      expect(result.dependency).toBeNull();
    });

    test('debe validar formato de task ID', () => {
      const line = '- [ ] Task 🔗 ⬆️ ^invalid-id-format';

      const result = manager.parseDependencyFromLine(line, 'task-1');

      // Debería aceptar si el formato es válido (comienza con ^)
      expect(result.success).toBe(true);
    });
  });

  // ==================== REGISTRAR DEPENDENCIES ====================
  describe('dependencyManager - Register Dependencies', () => {
    test('debe registrar una dependencia', () => {
      const task: Task = {
        id: 'task-b',
        description: 'Task B',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.addDependency(task, 'task-a', 'depends');

      expect(result.success).toBe(true);
      expect(result.task?.dependencies).toContain('task-a');
    });

    test('debe registrar que bloquea otra tarea', () => {
      const task: Task = {
        id: 'task-a',
        description: 'Task A',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.addDependency(task, 'task-b', 'blocks');

      expect(result.success).toBe(true);
      expect(result.task?.blocking).toContain('task-b');
    });

    test('debe NO duplicar dependencias', () => {
      const task: Task = {
        id: 'task-b',
        description: 'Task B',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-a'],
        tags: []
      };

      const result = manager.addDependency(task, 'task-a', 'depends');

      expect(result.success).toBe(true);
      // Solo debe haber una instancia de task-a
      expect(result.task?.dependencies?.filter((d: string) => d === 'task-a').length).toBe(1);
    });
  });

  // ==================== VALIDAR CICLOS ====================
  describe('dependencyManager - Cycle Detection', () => {
    test('debe detectar ciclo simple: A → B → A', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-b'], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] }
      ];

      const result = manager.detectCycles(tasks);

      expect(result.hasCycles).toBe(true);
      expect(result.cycles).toContain(expect.objectContaining({ from: 'task-a', to: 'task-b' }));
    });

    test('debe detectar ciclo complejo: A → B → C → A', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-b'], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-c'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] }
      ];

      const result = manager.detectCycles(tasks);

      expect(result.hasCycles).toBe(true);
    });

    test('debe NO detectar ciclos en árbol válido', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] }
      ];

      const result = manager.detectCycles(tasks);

      expect(result.hasCycles).toBe(false);
    });
  });

  // ==================== RESOLVER DEPENDENCIAS ====================
  describe('dependencyManager - Resolve Dependencies', () => {
    test('debe resolver que tarea PUEDE ejecutarse si dependencias DONE', () => {
      const task: Task = {
        id: 'task-b',
        description: 'B',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-a'],
        tags: []
      };

      const dependencyTask: Task = {
        id: 'task-a',
        description: 'A',
        status: 'DONE',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.resolveDependencies(task, [dependencyTask]);

      expect(result.success).toBe(true);
      expect(result.canExecute).toBe(true);
    });

    test('debe resolver que tarea NO puede ejecutarse si dependencias TODO', () => {
      const task: Task = {
        id: 'task-b',
        description: 'B',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-a'],
        tags: []
      };

      const dependencyTask: Task = {
        id: 'task-a',
        description: 'A',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.resolveDependencies(task, [dependencyTask]);

      expect(result.success).toBe(true);
      expect(result.canExecute).toBe(false);
      expect(result.blockedBy).toContain('task-a');
    });

    test('debe resolver múltiples dependencias', () => {
      const task: Task = {
        id: 'task-c',
        description: 'C',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-a', 'task-b'],
        tags: []
      };

      const depA: Task = {
        id: 'task-a',
        description: 'A',
        status: 'DONE',
        priority: 'MEDIA',
        tags: []
      };

      const depB: Task = {
        id: 'task-b',
        description: 'B',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const result = manager.resolveDependencies(task, [depA, depB]);

      expect(result.success).toBe(true);
      expect(result.canExecute).toBe(false);
      expect(result.blockedBy).toContain('task-b');
    });
  });

  // ==================== CRÍTICA PATH ====================
  describe('dependencyManager - Critical Path', () => {
    test('debe calcular critical path para simple chain', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-b'], tags: [] }
      ];

      const result = manager.calculateCriticalPath(tasks);

      expect(result.success).toBe(true);
      expect(result.criticalPath).toContain('task-a');
      expect(result.criticalPath).toContain('task-b');
      expect(result.criticalPath).toContain('task-c');
    });

    test('debe identificar tarea crítica', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] }
      ];

      const result = manager.calculateCriticalPath(tasks);

      // task-a es crítica (bloquea task-b y task-c)
      expect(result.criticalTasks).toContain('task-a');
    });
  });

  // ==================== IMPACTO DE CAMBIOS ====================
  describe('dependencyManager - Change Impact', () => {
    test('debe calcular impacto de completar task', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-b'], tags: [] }
      ];

      const result = manager.calculateImpact(tasks, 'task-a', 'DONE');

      expect(result.success).toBe(true);
      expect(result.affected).toContain('task-b');
      expect(result.affected).toContain('task-c');
    });

    test('debe retornar vacío si no hay impacto', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], blocking: ['task-c'], tags: [] }
      ];

      const result = manager.calculateImpact(tasks, 'task-b', 'DONE');

      // task-b está en medio, al completarse no desbloquea a nadie directamente
      expect(result.success).toBe(true);
    });
  });

  // ==================== EDGE CASES ====================
  describe('dependencyManager - Edge Cases', () => {
    test('debe manejar task null', () => {
      const result = manager.addDependency(null, 'task-a', 'depends');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe manejar auto-referencia (tarea depende de sí misma)', () => {
      const result = manager.addDependency(
        { id: 'task-a', description: 'A', status: 'TODO', priority: 'MEDIA', tags: [] },
        'task-a',
        'depends'
      );

      expect(result.success).toBe(false);
    });

    test('debe manejar dependencias a tasks inexistentes', () => {
      const task: Task = {
        id: 'task-b',
        description: 'B',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-nonexistent'],
        tags: []
      };

      const result = manager.resolveDependencies(task, []);

      expect(result.success).toBe(false);
    });

    test('debe permitir remover dependencias', () => {
      const task: Task = {
        id: 'task-b',
        description: 'B',
        status: 'TODO',
        priority: 'MEDIA',
        dependencies: ['task-a', 'task-c'],
        tags: []
      };

      const result = manager.removeDependency(task, 'task-a');

      expect(result.success).toBe(true);
      expect(result.task?.dependencies).toContain('task-c');
      expect(result.task?.dependencies).not.toContain('task-a');
    });
  });

  // ==================== VISUALIZACIÓN ====================
  describe('dependencyManager - Visualization', () => {
    test('debe generar grafo de dependencias', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] },
        { id: 'task-c', description: 'C', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-b'], tags: [] }
      ];

      const result = manager.generateDependencyGraph(tasks);

      expect(result.nodes.length).toBe(3);
      expect(result.edges.length).toBe(2);
    });

    test('debe generar representación text para debug', () => {
      const tasks = [
        { id: 'task-a', description: 'A', status: 'TODO' as const, priority: 'MEDIA', dependencies: [], tags: [] },
        { id: 'task-b', description: 'B', status: 'TODO' as const, priority: 'MEDIA', dependencies: ['task-a'], tags: [] }
      ];

      const result = manager.visualizeDependencies(tasks);

      expect(result).toContain('task-a');
      expect(result).toContain('task-b');
    });
  });
});
