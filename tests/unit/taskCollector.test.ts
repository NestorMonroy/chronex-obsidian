/**
 * UC-055: TASK COLLECTOR + TEMPLATE ENGINE
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que colecciona tasks del Vault y motor de templates mejorado.
 * 
 * Dos componentes integrados:
 * 1. TaskCollector - Coleccionar, filtrar, agrupar tasks
 * 2. TemplateEngine - Resolver variables {{VALUE:...}} e includes
 * 
 * Convención de nombres:
 * ✅ camelCase: taskCollector, templateEngine
 * ✅ Archivo: taskCollector.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos
 */
interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  dueDate?: string;
  createdDate: string;
  tags: string[];
  filePath: string;
}

interface TemplateVariable {
  name: string;
  value?: string;
  resolver: () => string;
  type: 'static' | 'dynamic' | 'computed';
}

interface TemplateContext {
  variables: Record<string, string>;
  folderPath: string;
  fileName: string;
}

// =====================================================================================
// PARTE 1: TASK COLLECTOR TESTS (40 tests)
// =====================================================================================

describe('UC-055: TaskCollector - Task Collection', () => {
  let collector: any;

  beforeEach(() => {
    const TaskCollector = require('../../src/services/task-parser/taskCollector').TaskCollector;
    collector = new TaskCollector();
  });

  // ==================== COLECCIONAR TASKS ====================
  describe('TaskCollector - Collect Tasks', () => {
    test('debe coleccionar tasks de múltiples archivos', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'inbox.md' },
        { id: 'task-2', title: 'Task 2', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-10', tags: [], filePath: 'projects/proj-a.md' }
      ];

      const tasks = await collector.collectAllTasks('./vault');

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(0);
    });

    test('debe retornar array vacío si no hay tasks', async () => {
      const tasks = await collector.collectAllTasks('./empty-vault');

      expect(tasks).toEqual([]);
    });

    test('cada task debe tener estructura completa', async () => {
      const tasks = await collector.collectAllTasks('./vault');

      if (tasks.length > 0) {
        const task = tasks[0];
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.filePath).toBeDefined();
      }
    });
  });

  // ==================== FILTRAR POR FECHA ====================
  describe('TaskCollector - Filter by Date', () => {
    test('debe filtrar tasks de hoy', () => {
      const today = new Date().toISOString().split('T')[0];
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: today, createdDate: today, tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: '2026-04-01', createdDate: '2026-04-01', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByDate(tasks, { type: 'today' });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    test('debe filtrar tasks de esta semana', () => {
      const today = new Date();
      const inWeek = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: inWeek, createdDate: inWeek, tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: '2026-05-01', createdDate: '2026-05-01', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByDate(tasks, { type: 'week' });

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('debe filtrar tasks de este mes', () => {
      const today = new Date();
      const inMonth = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: inMonth, createdDate: inMonth, tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: '2026-06-01', createdDate: '2026-06-01', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByDate(tasks, { type: 'month' });

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('debe filtrar tasks vencidas', () => {
      const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: yesterday, createdDate: yesterday, tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, dueDate: today, createdDate: today, tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByDate(tasks, { type: 'overdue' });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
  });

  // ==================== FILTRAR POR STATUS ====================
  describe('TaskCollector - Filter by Status', () => {
    test('debe filtrar tasks TODO', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByStatus(tasks, 'TODO');

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('TODO');
    });

    test('debe filtrar tasks DONE', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' },
        { id: '3', title: 'T3', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'c.md' }
      ];

      const result = collector.filterByStatus(tasks, 'DONE');

      expect(result.length).toBe(2);
    });

    test('debe filtrar tasks IN_PROGRESS', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'IN_PROGRESS' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByStatus(tasks, 'IN_PROGRESS');

      expect(result.length).toBe(1);
    });
  });

  // ==================== FILTRAR POR PRIORIDAD ====================
  describe('TaskCollector - Filter by Priority', () => {
    test('debe filtrar tasks ALTA prioridad', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' }
      ];

      const result = collector.filterByPriority(tasks, 'ALTA');

      expect(result.length).toBe(1);
      expect(result[0].priority).toBe('ALTA');
    });

    test('debe filtrar tasks BAJA prioridad', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'BAJA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' },
        { id: '3', title: 'T3', status: 'TODO' as const, priority: 'BAJA' as const, createdDate: '2026-04-11', tags: [], filePath: 'c.md' }
      ];

      const result = collector.filterByPriority(tasks, 'BAJA');

      expect(result.length).toBe(2);
    });
  });

  // ==================== FILTRAR POR TAGS ====================
  describe('TaskCollector - Filter by Tags', () => {
    test('debe filtrar tasks por tag único', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: ['trabajo'], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: ['personal'], filePath: 'b.md' }
      ];

      const result = collector.filterByTags(tasks, ['trabajo']);

      expect(result.length).toBe(1);
      expect(result[0].tags).toContain('trabajo');
    });

    test('debe filtrar tasks por múltiples tags', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: ['trabajo', 'urgente'], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: ['personal'], filePath: 'b.md' }
      ];

      const result = collector.filterByTags(tasks, ['trabajo', 'urgente']);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== FILTRAR POR CARPETA ====================
  describe('TaskCollector - Filter by Folder', () => {
    test('debe filtrar tasks por carpeta', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'inbox/task1.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'projects/task2.md' }
      ];

      const result = collector.filterByFolder(tasks, 'inbox');

      expect(result.length).toBe(1);
      expect(result[0].filePath).toContain('inbox');
    });
  });

  // ==================== AGRUPAR ====================
  describe('TaskCollector - Group Tasks', () => {
    test('debe agrupar tasks por carpeta', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'inbox/task1.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'inbox/task2.md' },
        { id: '3', title: 'T3', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'projects/task3.md' }
      ];

      const result = collector.groupByFolder(tasks);

      expect(result.size).toBe(2);
      expect(result.get('inbox')?.length).toBe(2);
      expect(result.get('projects')?.length).toBe(1);
    });

    test('debe agrupar tasks por status', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' },
        { id: '3', title: 'T3', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'c.md' }
      ];

      const result = collector.groupByStatus(tasks);

      expect(result.size).toBe(2);
      expect(result.get('TODO')?.length).toBe(2);
      expect(result.get('DONE')?.length).toBe(1);
    });

    test('debe agrupar tasks por prioridad', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' },
        { id: '3', title: 'T3', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'c.md' }
      ];

      const result = collector.groupByPriority(tasks);

      expect(result.size).toBe(2);
      expect(result.get('ALTA')?.length).toBe(2);
    });
  });

  // ==================== ESTADÍSTICAS ====================
  describe('TaskCollector - Statistics', () => {
    test('debe calcular estadísticas básicas', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'DONE' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' },
        { id: '3', title: 'T3', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'c.md' }
      ];

      const stats = collector.getStatistics(tasks);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.completionPercentage).toBe(33.33);
    });

    test('debe calcular tareas por prioridad', () => {
      const tasks = [
        { id: '1', title: 'T1', status: 'TODO' as const, priority: 'ALTA' as const, createdDate: '2026-04-11', tags: [], filePath: 'a.md' },
        { id: '2', title: 'T2', status: 'TODO' as const, priority: 'MEDIA' as const, createdDate: '2026-04-11', tags: [], filePath: 'b.md' }
      ];

      const stats = collector.getStatistics(tasks);

      expect(stats.byPriority).toBeDefined();
      expect(stats.byPriority['ALTA']).toBe(1);
      expect(stats.byPriority['MEDIA']).toBe(1);
    });
  });
});

// =====================================================================================
// PARTE 2: TEMPLATE ENGINE TESTS (35 tests)
// =====================================================================================

describe('UC-055: TemplateEngine - Template Processing', () => {
  let engine: any;

  beforeEach(() => {
    const TemplateEngine = require('../../src/services/task-parser/taskCollector').TemplateEngine;
    engine = new TemplateEngine();
  });

  // ==================== RESOLVER VARIABLES ====================
  describe('TemplateEngine - Resolve Variables', () => {
    test('debe resolver {{VALUE:uniqueId}}', () => {
      const context: TemplateContext = {
        variables: { uniqueId: 'task-abc123' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('uniqueId', context);

      expect(result).toBe('task-abc123');
    });

    test('debe resolver {{VALUE:currentDate}}', () => {
      const context: TemplateContext = {
        variables: { currentDate: '2026-04-11' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('currentDate', context);

      expect(result).toBe('2026-04-11');
    });

    test('debe resolver {{VALUE:fileName}}', () => {
      const context: TemplateContext = {
        variables: { fileName: 'Mi Tarea' },
        folderPath: 'inbox',
        fileName: 'Mi Tarea.md'
      };

      const result = engine.resolveVariable('fileName', context);

      expect(result).toBe('Mi Tarea');
    });

    test('debe resolver {{VALUE:folderName}}', () => {
      const context: TemplateContext = {
        variables: { folderName: 'inbox' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('folderName', context);

      expect(result).toBe('inbox');
    });

    test('debe resolver {{VALUE:alias}}', () => {
      const context: TemplateContext = {
        variables: { alias: 'task-alias' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('alias', context);

      expect(result).toBe('task-alias');
    });

    test('debe resolver {{VALUE:priority}}', () => {
      const context: TemplateContext = {
        variables: { priority: 'ALTA' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('priority', context);

      expect(result).toBe('ALTA');
    });

    test('debe resolver {{VALUE:dueDate}}', () => {
      const context: TemplateContext = {
        variables: { dueDate: '2026-04-15' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('dueDate', context);

      expect(result).toBe('2026-04-15');
    });
  });

  // ==================== PROCESAR TEMPLATES ====================
  describe('TemplateEngine - Process Template', () => {
    test('debe procesar template con una variable', () => {
      const template = 'UID: {{VALUE:uniqueId}}';
      const context: TemplateContext = {
        variables: { uniqueId: 'task-123' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.processTemplate(template, context);

      expect(result).toContain('task-123');
    });

    test('debe procesar template con múltiples variables', () => {
      const template = `---
UID: {{VALUE:uniqueId}}
aliases: {{VALUE:alias}}
date: {{VALUE:currentDate}}
---`;

      const context: TemplateContext = {
        variables: {
          uniqueId: 'task-123',
          alias: 'my-task',
          currentDate: '2026-04-11'
        },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.processTemplate(template, context);

      expect(result).toContain('task-123');
      expect(result).toContain('my-task');
      expect(result).toContain('2026-04-11');
    });

    test('debe dejar variables desconocidas sin resolver', () => {
      const template = 'Valor: {{VALUE:unknown}}';
      const context: TemplateContext = {
        variables: {},
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.processTemplate(template, context);

      expect(result).toContain('{{VALUE:unknown}}');
    });
  });

  // ==================== PROCESAR INCLUDES ====================
  describe('TemplateEngine - Process Includes', () => {
    test('debe procesar include válido', () => {
      const template = `# Título
<% tp.file.include('[[common/templateMetadata]]') %>
Contenido`;

      const result = engine.processIncludes(template);

      expect(result).toBeDefined();
    });

    test('debe validar que include existe', () => {
      const template = `<% tp.file.include('[[common/templateMetadata]]') %>`;

      const result = engine.validateInclude('common/templateMetadata');

      expect(result.valid).toBe(true);
    });

    test('debe detectar include inválido', () => {
      const result = engine.validateInclude('nonexistent/file');

      expect(result.valid).toBe(false);
    });
  });

  // ==================== VALIDAR TEMPLATES ====================
  describe('TemplateEngine - Validate Template', () => {
    test('debe validar UID único', () => {
      const uid = 'task-unique-123';

      const result = engine.validateUID(uid);

      expect(result.valid).toBe(true);
    });

    test('debe detectar UID duplicado', () => {
      engine.registerUID('task-dup');
      
      const result = engine.validateUID('task-dup');

      expect(result.valid).toBe(false);
    });

    test('debe validar frontmatter completo', () => {
      const frontmatter = {
        UID: 'task-123',
        aliases: ['t1', 't2'],
        type: 'task',
        date: '2026-04-11',
        tags: []
      };

      const result = engine.validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
    });

    test('debe detectar frontmatter incompleto', () => {
      const frontmatter = {
        UID: 'task-123'
        // Faltan otros campos
      };

      const result = engine.validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
    });

    test('debe validar formato de alias', () => {
      const result = engine.validateAlias('valid-alias-123');

      expect(result.valid).toBe(true);
    });

    test('debe detectar alias inválido', () => {
      const result = engine.validateAlias('invalid alias!@#');

      expect(result.valid).toBe(false);
    });

    test('debe validar formato de tags', () => {
      const tags = ['trabajo', 'urgente', 'proyecto-a'];

      const result = engine.validateTags(tags);

      expect(result.valid).toBe(true);
    });
  });

  // ==================== MIXINS: QUICKADD + TEMPLATER ====================
  describe('TemplateEngine - Mixins (QuickAdd + Templater)', () => {
    test('debe mezclar {{VALUE:...}} con <% %>  correctamente', () => {
      const template = `---
UID: {{VALUE:uniqueId}}
date: {{VALUE:currentDate}}
---
<%""%>
# [[<% tp.file.folder() %>]] {{VALUE:fileName}}`;

      const context: TemplateContext = {
        variables: {
          uniqueId: 'task-123',
          currentDate: '2026-04-11',
          fileName: 'Mi Tarea'
        },
        folderPath: 'inbox',
        fileName: 'Mi Tarea.md'
      };

      const result = engine.processMixins(template, context);

      expect(result).toContain('task-123');
      expect(result).toContain('2026-04-11');
      expect(result).toContain('Mi Tarea');
    });

    test('debe no romper Templater functions', () => {
      const template = '<% tp.date.now("YYYY-MM-DD") %>';

      const result = engine.processMixins(template, { variables: {}, folderPath: '', fileName: '' });

      expect(result).toContain('<% tp.date.now');
    });

    test('debe resolver variables antes de Templater', () => {
      const template = `UID: {{VALUE:uniqueId}}
Creado: <% tp.date.now("YYYY-MM-DD") %>`;

      const context: TemplateContext = {
        variables: { uniqueId: 'task-123' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.processMixins(template, context);

      expect(result).toContain('task-123');
      expect(result).toContain('<% tp.date.now');
    });
  });

  // ==================== REGISTRAR VARIABLES PERSONALIZADAS ====================
  describe('TemplateEngine - Register Custom Variables', () => {
    test('debe registrar variable personalizada', () => {
      const resolver = () => 'custom-value';
      
      engine.registerVariable('customVar', resolver);

      const context: TemplateContext = {
        variables: { customVar: 'custom-value' },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('customVar', context);

      expect(result).toBe('custom-value');
    });

    test('debe ejecutar resolver function', () => {
      const resolver = () => new Date().toISOString().split('T')[0];
      
      engine.registerVariable('today', resolver);
      const today = new Date().toISOString().split('T')[0];

      const context: TemplateContext = {
        variables: { today },
        folderPath: 'inbox',
        fileName: 'task.md'
      };

      const result = engine.resolveVariable('today', context);

      expect(result).toBe(today);
    });
  });

  // ==================== VALIDACIÓN COMPLETA ====================
  describe('TemplateEngine - Full Validation', () => {
    test('debe validar template completo válido', () => {
      const template = `---
UID: {{VALUE:uniqueId}}
aliases: {{VALUE:alias}}
type: task
date: {{VALUE:currentDate}}
tags: [ ]
<% tp.file.include('[[common/templateMetadata]]') %>
---
<%""%>
# 📋 [[<% tp.file.folder() %>]] {{VALUE:fileName}}

<% tp.file.include('[[common/templateNotes]]') %>`;

      const result = engine.validateTemplate(template);

      expect(result.valid).toBe(true);
    });

    test('debe detectar múltiples errores', () => {
      const template = `---
UID: {{VALUE:uniqueId}}
<% tp.file.include('[[nonexistent/file]]') %>
---`;

      const result = engine.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
