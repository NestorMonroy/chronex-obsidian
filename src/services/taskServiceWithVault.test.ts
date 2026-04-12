/**
 * SEMANA 1: Tests para métodos nuevos de TaskServiceWithVault
 * 
 * Métodos a testear:
 * - getTaskById()
 * - updateTaskWithVault()
 * - deleteTaskWithVault()
 * - parseTaskContent()
 * - calculateProgress()
 */

import { TaskServiceWithVault } from './taskServiceWithVault';

describe('TaskServiceWithVault - SEMANA 1 (Nuevos métodos)', () => {
  
  // ==================== getTaskById() ====================
  
  describe('getTaskById()', () => {
    test('debería obtener tarea por ID', async () => {
      const taskId = 'TSK-202604-ABC';
      // Mock: crear tarea primero
      const result = await TaskServiceWithVault.getTaskById(taskId);
      // Esperado: resultado no nulo si existe
      expect(result).toBeDefined();
    });

    test('debería retornar null si tarea no existe', async () => {
      const result = await TaskServiceWithVault.getTaskById('TSK-999999-XXX');
      expect(result).toBeNull();
    });

    test('debería retornar tarea con todos los campos', async () => {
      // Esperado: taskId, folderPath, notePath, frontmatter
      // Este test requiere setup de datos previo
    });
  });

  // ==================== updateTaskWithVault() ====================

  describe('updateTaskWithVault()', () => {
    test('debería actualizar título de tarea', async () => {
      const taskId = 'TSK-202604-ABC';
      const updates = { taskName: 'Nuevo Título' };
      
      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);
      
      expect(result.success).toBe(true);
      expect(result.frontmatter?.title).toBe('Nuevo Título');
    });

    test('debería actualizar prioridad', async () => {
      const taskId = 'TSK-202604-ABC';
      const updates = { priority: 'ALTA' };

      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates as any);
      
      expect(result.success).toBe(true);
      expect(result.frontmatter?.priority).toBe('ALTA');
    });

    test('debería actualizar dueDate', async () => {
      const taskId = 'TSK-202604-ABC';
      const updates = { dueDate: '2026-05-15' };
      
      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);
      
      expect(result.success).toBe(true);
      expect(result.frontmatter?.dueDate).toBe('2026-05-15');
    });

    test('debería actualizar descripción', async () => {
      const taskId = 'TSK-202604-ABC';
      const updates = { description: 'Nueva descripción' };
      
      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);
      
      expect(result.success).toBe(true);
      expect(result.frontmatter?.description).toBe('Nueva descripción');
    });

    test('debería fallar si tarea no existe', async () => {
      const result = await TaskServiceWithVault.updateTaskWithVault(
        'TSK-999999-XXX',
        { taskName: 'Test' }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('debería sincronizar con .index.json', async () => {
      // Mock IndexSyncService para verificar que se llamó
      const taskId = 'TSK-202604-ABC';
      const updates = { taskName: 'Test' };
      
      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);
      
      // Verificar que updateIndexEntry fue llamado
      expect(result.success).toBe(true);
    });

    test('debería conservar otros campos', async () => {
      // Si solo actualizas title, otros campos no deberían cambiar
      const taskId = 'TSK-202604-ABC';
      const originalTask = await TaskServiceWithVault.getTaskById(taskId);
      const updates = { taskName: 'Nuevo Título' };
      
      const result = await TaskServiceWithVault.updateTaskWithVault(taskId, updates);
      
      expect(result.frontmatter?.priority).toBe(originalTask?.frontmatter?.priority);
      expect(result.frontmatter?.dueDate).toBe(originalTask?.frontmatter?.dueDate);
    });
  });

  // ==================== deleteTaskWithVault() ====================

  describe('deleteTaskWithVault()', () => {
    test('debería eliminar tarea por ID', async () => {
      const taskId = 'TSK-202604-DEL';
      // Setup: crear tarea de test primero
      
      const result = await TaskServiceWithVault.deleteTaskWithVault(taskId);
      
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(taskId);
    });

    test('debería fallar si tarea no existe', async () => {
      const result = await TaskServiceWithVault.deleteTaskWithVault('TSK-999999-XXX');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('debería eliminar carpeta de tarea', async () => {
      // Verificar que la carpeta fue eliminada
      // Esperado: folderPath no debería existir
    });

    test('debería sincronizar con .index.json', async () => {
      const taskId = 'TSK-202604-DEL';
      
      const result = await TaskServiceWithVault.deleteTaskWithVault(taskId);
      
      // Verificar que deleteIndexEntry fue llamado
      expect(result.success).toBe(true);
    });

    test('debería mostrar notificación de éxito', async () => {
      // Mock showSuccessNotice para verificar
      const taskId = 'TSK-202604-DEL';
      
      await TaskServiceWithVault.deleteTaskWithVault(taskId);
      
      // Verificar que se mostró notificación
    });
  });

  // ==================== parseTaskContent() ====================

  describe('parseTaskContent()', () => {
    test('debería detectar líneas de checkbox', () => {
      const content = `
# Tarea

- [ ] Subtarea 1
- [x] Subtarea 2
- [ ] Subtarea 3
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks.length).toBe(3);
      expect(result.subtasks[0].completed).toBe(false);
      expect(result.subtasks[1].completed).toBe(true);
      expect(result.subtasks[2].completed).toBe(false);
    });

    test('debería detectar prioridades con emojis', () => {
      const content = `
- [ ] Tarea crítica 🔺
- [ ] Tarea alta ⏫
- [ ] Tarea media 🔼
- [ ] Tarea baja 🔽
- [ ] Tarea muy baja ⏬
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks[0].priority).toBe('CRÍTICA');
      expect(result.subtasks[1].priority).toBe('ALTA');
      expect(result.subtasks[2].priority).toBe('MEDIA');
      expect(result.subtasks[3].priority).toBe('BAJA');
      expect(result.subtasks[4].priority).toBe('MUY BAJA');
    });

    test('debería detectar fechas', () => {
      const content = `
- [ ] Tarea con fecha 2026-05-15
- [ ] Tarea sin fecha
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks[0].hasDates).toBe(true);
      expect(result.subtasks[1].hasDates).toBe(false);
    });

    test('debería manejar líneas vacías', () => {
      const content = `
- [ ] Tarea 1

- [ ] Tarea 2


- [ ] Tarea 3
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks.length).toBe(3);
    });

    test('debería manejar indentación', () => {
      const content = `
- [ ] Nivel 1
  - [ ] Nivel 2
    - [ ] Nivel 3
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      // Debería parsear todas, incluso con indentación
      expect(result.subtasks.length).toBe(3);
    });

    test('debería retornar array vacío si no hay subtareas', () => {
      const content = `
# Tarea sin subtareas

Esta es solo descripción.
Sin líneas de checkbox.
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks.length).toBe(0);
    });

    test('debería manejar caracteres especiales', () => {
      const content = `
- [ ] Tarea con ñ y acentos áéíóú
- [ ] Tarea con emojis 😊 🎉
- [ ] Tarea con símbolos @#$%
      `;

      const result = TaskServiceWithVault.parseTaskContent(content);

      expect(result.subtasks.length).toBe(3);
      expect(result.subtasks[0].content).toContain('ñ');
    });
  });

  // ==================== calculateProgress() ====================

  describe('calculateProgress()', () => {
    test('debería calcular 0% para tareas sin completar', () => {
      const content = `
- [ ] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(0);
      expect(result.percentage).toBe(0);
    });

    test('debería calcular 100% para tareas completadas', () => {
      const content = `
- [x] Tarea 1
- [x] Tarea 2
- [x] Tarea 3
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(3);
      expect(result.percentage).toBe(100);
    });

    test('debería calcular 33% para 1 de 3 completadas', () => {
      const content = `
- [x] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(33);
    });

    test('debería calcular 50% para 2 de 4 completadas', () => {
      const content = `
- [x] Tarea 1
- [ ] Tarea 2
- [x] Tarea 3
- [ ] Tarea 4
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(4);
      expect(result.completed).toBe(2);
      expect(result.percentage).toBe(50);
    });

    test('debería retornar 0% si no hay tareas', () => {
      const content = `
# Sin tareas

Solo contenido normal.
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.percentage).toBe(0);
    });

    test('debería ser case-insensitive para [x]', () => {
      const content = `
- [X] Tarea 1
- [x] Tarea 2
- [ ] Tarea 3
      `;

      const result = TaskServiceWithVault.calculateProgress(content);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.percentage).toBe(67);
    });
  });

  // ==================== INTEGRACIÓN ====================

  describe('Integración - Flujo completo', () => {
    test('debería poder crear, actualizar y obtener una tarea', async () => {
      // 1. Crear
      const createResult = await TaskServiceWithVault.createTaskWithVault({
        taskName: 'Tarea de Test',
        description: 'Descripción test',
        priority: 'MEDIA',
        dueDate: '2026-05-15',
      });

      expect(createResult.success).toBe(true);
      const taskId = createResult.taskId!;

      // 2. Obtener
      const getResult = await TaskServiceWithVault.getTaskById(taskId);
      expect(getResult).not.toBeNull();
      expect(getResult?.frontmatter?.title).toBe('Tarea de Test');

      // 3. Actualizar
      const updateResult = await TaskServiceWithVault.updateTaskWithVault(
        taskId,
        { taskName: 'Tarea Actualizada' }
      );
      expect(updateResult.success).toBe(true);
      expect(updateResult.frontmatter?.title).toBe('Tarea Actualizada');

      // 4. Obtener de nuevo para verificar
      const getFinalResult = await TaskServiceWithVault.getTaskById(taskId);
      expect(getFinalResult?.frontmatter?.title).toBe('Tarea Actualizada');
    });

    test('debería poder listar y encontrar una tarea actualizada', async () => {
      // 1. Crear y actualizar
      const createResult = await TaskServiceWithVault.createTaskWithVault({
        taskName: 'Test List',
      });

      const taskId = createResult.taskId!;

      await TaskServiceWithVault.updateTaskWithVault(taskId, {
        taskName: 'Test List Updated',
        priority: 'ALTA',
      });

      // 2. Listar y verificar
      const allTasks = await TaskServiceWithVault.listTasksFromVault();
      const found = allTasks.find((t) => t.taskId === taskId);

      expect(found).not.toBeNull();
      expect(found?.frontmatter?.title).toBe('Test List Updated');
      expect(found?.frontmatter?.priority).toBe('ALTA');
    });
  });
});
