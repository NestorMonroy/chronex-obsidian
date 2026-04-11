/**
 * QuickAdd UserScript: Create Task
 * Implements UC-002: CREATE TASK
 * 
 * @file createTask.js
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

async function createTask(QuickAdd, api) {
  // Solicitar nombre de tarea
  const taskName = await api.inputPrompt(
    'Nombre de la tarea:',
    'Ingresa el nombre de la tarea'
  );

  if (!taskName) {
    api.showNotice('Operación cancelada', 3);
    return;
  }

  // Solicitar descripción
  const description = await api.inputPrompt(
    'Descripción:',
    'Describe la tarea'
  );

  // Solicitar prioridad (1-5)
  const priority = await api.inputPrompt(
    'Prioridad (1-5):',
    'Nivel de prioridad'
  );

  // Solicitar fecha de vencimiento
  const dueDate = await api.inputPrompt(
    'Fecha límite (YYYY-MM-DD):',
    'Cuándo vence esta tarea'
  );

  // Validar
  if (taskName.length < 3 || taskName.length > 100) {
    api.showNotice('El nombre debe tener entre 3 y 100 caracteres', 3);
    return null;
  }

  // Generar valores
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const taskId = `task-${timestamp}-${randomHex}`;

  const createdAt = new Date().toISOString();
  const author = 'Nestor';

  const fileName = taskName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    || 'tarea';

  return {
    fileName: fileName,
    taskId: taskId,
    taskName: taskName,
    description: description || 'Sin descripción',
    status: 'active',
    priority: priority || '3',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    createdAt: createdAt,
    author: author
  };
}

module.exports = createTask;
