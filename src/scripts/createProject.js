/**
 * QuickAdd UserScript: Create Project
 * Implements UC-003: CREATE PROJECT
 * 
 * @file createProject.js
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

async function createProject(QuickAdd, api) {
  const projectName = await api.inputPrompt(
    'Nombre del proyecto:',
    'Ingresa el nombre del proyecto'
  );

  if (!projectName) {
    api.showNotice('Operación cancelada', 3);
    return;
  }

  const objective = await api.inputPrompt(
    'Objetivo principal:',
    'Cuál es el objetivo del proyecto'
  );

  const description = await api.inputPrompt(
    'Descripción:',
    'Describe el proyecto en detalle'
  );

  const startDate = await api.inputPrompt(
    'Fecha de inicio (YYYY-MM-DD):',
    'Cuándo comienza el proyecto'
  );

  const endDate = await api.inputPrompt(
    'Fecha de fin (YYYY-MM-DD):',
    'Cuándo finaliza el proyecto'
  );

  if (projectName.length < 3) {
    api.showNotice('El nombre debe tener al menos 3 caracteres', 3);
    return null;
  }

  const timestamp = Date.now();
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const projectId = `proj-${timestamp}-${randomHex}`;

  const createdAt = new Date().toISOString();
  const author = 'Nestor';

  const fileName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    || 'proyecto';

  return {
    fileName: fileName,
    projectId: projectId,
    projectName: projectName,
    objective: objective || 'No especificado',
    description: description || 'Sin descripción',
    status: 'planning',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    createdAt: createdAt,
    author: author
  };
}

module.exports = createProject;
