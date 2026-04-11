/**
 * QuickAdd UserScript: Create Pillar
 * Implements UC-004: CREATE PILLAR
 * 
 * @file createPillar.js
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

async function createPillar(QuickAdd, api) {
  const pillarName = await api.inputPrompt(
    'Nombre del pilar:',
    'Ingresa el nombre del pilar'
  );

  if (!pillarName) {
    api.showNotice('Operación cancelada', 3);
    return;
  }

  const purpose = await api.inputPrompt(
    'Propósito:',
    'Cuál es el propósito de este pilar'
  );

  const description = await api.inputPrompt(
    'Descripción:',
    'Describe el pilar en detalle'
  );

  if (pillarName.length < 3) {
    api.showNotice('El nombre debe tener al menos 3 caracteres', 3);
    return null;
  }

  const timestamp = Date.now();
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const pillarId = `pillar-${timestamp}-${randomHex}`;

  const createdAt = new Date().toISOString();
  const author = 'Nestor';

  const fileName = pillarName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    || 'pilar';

  return {
    fileName: fileName,
    pillarId: pillarId,
    pillarName: pillarName,
    purpose: purpose || 'No especificado',
    description: description || 'Sin descripción',
    status: 'active',
    createdAt: createdAt,
    author: author
  };
}

module.exports = createPillar;
