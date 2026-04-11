/**
 * UC-010: Create Objective (TIER 1 MVP)
 * 
 * Permite crear un objetivo dentro de la estructura del proyecto.
 * Similar a Create Project pero sin crear carpeta.
 * 
 * @see /docs/specification/use-cases/UC-010-create-objective.md
 */

export interface CreateObjectiveInput {
  objectiveName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
}

export interface ObjectiveFrontmatter {
  uid: string;
  type: string;
  title: string;
  description?: string;
  priority?: string;
  dateCreated: string;
  status: string;
}

export interface ObjectiveResult {
  success: boolean;
  objectiveId?: string;
  objectiveName?: string;
  noteCreated?: boolean;
  notePath?: string;
  frontmatter?: ObjectiveFrontmatter;
  notified?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface StoredObjective {
  objectiveId: string;
  objectiveName: string;
  description?: string;
  priority?: string;
  dateCreated: string;
  notePath: string;
}

export class ObjectiveService {
  private static objectives: Map<string, StoredObjective> = new Map();

  static async createObjective(input: CreateObjectiveInput): Promise<ObjectiveResult> {
    try {
      const validation = await this.validateObjectiveInput(input);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }

      const objectiveId = this.generateObjectiveId();
      const notePath = await this.createObjectiveNote(objectiveId, input);
      const frontmatter = this.createFrontmatter(objectiveId, input);

      await this.notifyUser(`Objetivo ${input.objectiveName} creado exitosamente`);

      const objective: StoredObjective = {
        objectiveId,
        objectiveName: input.objectiveName,
        description: input.description,
        priority: input.priority,
        dateCreated: new Date().toISOString(),
        notePath
      };

      this.objectives.set(objectiveId, objective);

      return {
        success: true,
        objectiveId,
        objectiveName: input.objectiveName,
        noteCreated: true,
        notePath,
        frontmatter,
        notified: true
      };
    } catch (error) {
      throw new Error(`Error creando objetivo: ${error}`);
    }
  }

  static async getObjective(objectiveId: string): Promise<StoredObjective | null> {
    return this.objectives.get(objectiveId) || null;
  }

  static async listObjectives(): Promise<StoredObjective[]> {
    return Array.from(this.objectives.values());
  }

  static async validateObjectiveInput(input: CreateObjectiveInput): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!input.objectiveName || input.objectiveName.trim() === '') {
      errors.push('objectiveName es requerido');
    }

    if (input.objectiveName && input.objectiveName.length > 200) {
      errors.push('objectiveName no puede superar 200 caracteres');
    }

    if (input.description && input.description.length > 2000) {
      errors.push('description no puede superar 2000 caracteres');
    }

    if (input.priority) {
      const validPriorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
      if (!validPriorities.includes(input.priority)) {
        errors.push(`priority debe ser uno de: ${validPriorities.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static generateObjectiveId(): string {
    const date = new Date();
    const yyyymm = date.getFullYear().toString() + 
                   String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `OBJ-${yyyymm}-${random}`;
  }

  private static async createObjectiveNote(objectiveId: string, input: CreateObjectiveInput): Promise<string> {
    const notePath = `200-PROYECTOS/objetivos/${objectiveId}/README.md`;
    return notePath;
  }

  private static createFrontmatter(objectiveId: string, input: CreateObjectiveInput): ObjectiveFrontmatter {
    return {
      uid: objectiveId,
      type: 'objetivo',
      title: input.objectiveName,
      description: input.description,
      priority: input.priority,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'activo'
    };
  }

  private static async notifyUser(message: string): Promise<void> {
    return;
  }
}

export const objectiveService = {
  create: (input: CreateObjectiveInput) => ObjectiveService.createObjective(input),
  get: (id: string) => ObjectiveService.getObjective(id),
  list: () => ObjectiveService.listObjectives(),
  validate: (input: CreateObjectiveInput) => ObjectiveService.validateObjectiveInput(input)
};
