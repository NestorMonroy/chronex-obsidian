/**
 * QuickAdd UserScript: Create Repository
 * Implements UC-001: CREATE REPOSITORY
 * 
 * @file createRepository.js
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

// Import utilities (in Obsidian context, these will be available via Templater)
// In QuickAdd: validateCommonInput, generateUniqueId, getCurrentDateTime, getAuthorName

async function createRepository(QuickAdd, api) {
  // Solicitar nombre del repositorio
  const repoName = await api.inputPrompt(
    'Nombre del repositorio:',
    'Ingresa el nombre del repositorio (3-50 caracteres)'
  );

  if (!repoName) {
    api.showNotice('Operación cancelada', 3);
    return;
  }

  // Solicitar descripción (opcional)
  const description = await api.inputPrompt(
    'Descripción (opcional):',
    'Escribe una descripción breve del repositorio'
  );

  // Validar nombre usando validación local (QuickAdd context)
  if (repoName.length < 3 || repoName.length > 50) {
    api.showNotice('El nombre debe tener entre 3 y 50 caracteres', 3);
    return null;
  }

  // Generar ID único (formato: repo-timestamp-random)
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const repositoryId = `repo-${timestamp}-${randomHex}`;

  // Obtener fecha/hora actual (ISO 8601)
  const createdAt = new Date().toISOString();

  // Obtener nombre del autor (default: Nestor)
  const author = 'Nestor';

  // Generar nombre de archivo (kebab-case)
  const fileName = repoName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'repositorio';

  // Retornar objeto con valores para template
  return {
    fileName: fileName,
    repositoryId: repositoryId,
    repositoryName: repoName,
    description: description || 'Sin descripción',
    createdAt: createdAt,
    author: author
  };
}

// Ejecutar script
module.exports = createRepository;
