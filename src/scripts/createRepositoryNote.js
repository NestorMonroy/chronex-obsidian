/**
 * QuickAdd UserScript: Create Repository Note
 * Implements UC-005: CREATE REPOSITORY NOTE
 * 
 * @file createRepositoryNote.js
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

async function createRepositoryNote(QuickAdd, api) {
  const noteName = await api.inputPrompt(
    'Nombre de la nota:',
    'Ingresa el nombre de la nota'
  );

  if (!noteName) {
    api.showNotice('Operación cancelada', 3);
    return;
  }

  const content = await api.inputPrompt(
    'Contenido:',
    'Escribe el contenido de la nota'
  );

  const repositoryId = await api.inputPrompt(
    'ID del repositorio:',
    'Ingresa el ID del repositorio al que pertenece'
  );

  const repositoryName = await api.inputPrompt(
    'Nombre del repositorio:',
    'Nombre del repositorio'
  );

  if (noteName.length < 3) {
    api.showNotice('El nombre debe tener al menos 3 caracteres', 3);
    return null;
  }

  const timestamp = Date.now();
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const noteId = `note-${timestamp}-${randomHex}`;

  const createdAt = new Date().toISOString();
  const author = 'Nestor';

  const fileName = noteName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    || 'nota';

  return {
    fileName: fileName,
    noteId: noteId,
    noteName: noteName,
    content: content || 'Sin contenido',
    repositoryId: repositoryId,
    repositoryName: repositoryName,
    status: 'active',
    createdAt: createdAt,
    author: author
  };
}

module.exports = createRepositoryNote;
