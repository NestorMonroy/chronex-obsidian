export interface CreateDocumentInput {
  documentName: string;
  description?: string;
  category?: string;
}

export interface DocumentFrontmatter {
  uid: string;
  type: string;
  title: string;
  description?: string;
  dateCreated: string;
  status: string;
}

export interface DocumentResult {
  success: boolean;
  documentId?: string;
  documentName?: string;
  noteCreated?: boolean;
  frontmatter?: DocumentFrontmatter;
}

export interface StoredDocument {
  documentId: string;
  documentName: string;
  description?: string;
  category?: string;
  dateCreated: string;
}

export class DocumentService {
  private static documents: Map<string, StoredDocument> = new Map();

  static async createDocument(input: CreateDocumentInput): Promise<DocumentResult> {
    if (!input.documentName || input.documentName.trim() === '') {
      throw new Error('documentName es requerido');
    }

    const documentId = this.generateDocumentId();
    const frontmatter = this.createFrontmatter(documentId, input);

    const doc: StoredDocument = {
      documentId,
      documentName: input.documentName,
      description: input.description,
      category: input.category,
      dateCreated: new Date().toISOString()
    };

    this.documents.set(documentId, doc);

    return {
      success: true,
      documentId,
      documentName: input.documentName,
      noteCreated: true,
      frontmatter
    };
  }

  static async getDocument(documentId: string): Promise<StoredDocument | null> {
    return this.documents.get(documentId) || null;
  }

  static async listDocuments(): Promise<StoredDocument[]> {
    return Array.from(this.documents.values());
  }

  private static generateDocumentId(): string {
    const date = new Date();
    const yyyymm = date.getFullYear().toString() + String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `DOC-${yyyymm}-${random}`;
  }

  private static createFrontmatter(documentId: string, input: CreateDocumentInput): DocumentFrontmatter {
    return {
      uid: documentId,
      type: 'documento',
      title: input.documentName,
      description: input.description,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'activo'
    };
  }
}

export const documentService = {
  create: (input: CreateDocumentInput) => DocumentService.createDocument(input),
  get: (id: string) => DocumentService.getDocument(id),
  list: () => DocumentService.listDocuments()
};
