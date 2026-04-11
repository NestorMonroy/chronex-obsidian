import { DocumentService, CreateDocumentInput } from '../../src/services/createDocument';

describe('UC-013: Create Document', () => {
  it('debe crear documento correctamente', async () => {
    const input: CreateDocumentInput = {
      documentName: 'Mi Documento',
      description: 'Desc'
    };
    const result = await DocumentService.createDocument(input);
    expect(result.success).toBe(true);
    expect(result.documentId).toMatch(/^DOC-\d{6}-[A-Z0-9]{5}$/);
  });

  it('debe validar documentName', async () => {
    const input: CreateDocumentInput = { documentName: '', description: 'Test' };
    await expect(DocumentService.createDocument(input)).rejects.toThrow();
  });

  it('debe obtener documento', async () => {
    const input: CreateDocumentInput = { documentName: 'Get Doc', description: 'Test' };
    const created = await DocumentService.createDocument(input);
    const result = await DocumentService.getDocument(created.documentId!);
    expect(result?.documentName).toBe('Get Doc');
  });

  it('debe listar documentos', async () => {
    const input: CreateDocumentInput = { documentName: 'List Doc', description: 'Test' };
    await DocumentService.createDocument(input);
    const docs = await DocumentService.listDocuments();
    expect(Array.isArray(docs)).toBe(true);
  });

  it('debe completar flujo end-to-end', async () => {
    const input: CreateDocumentInput = { documentName: 'E2E Doc', description: 'Test' };
    const result = await DocumentService.createDocument(input);
    expect(result.success).toBe(true);
    expect(result.noteCreated).toBe(true);
  });
});
