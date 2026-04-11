/**
 * UC-019: Edit Entity (TIER 1 MVP)
 * Permite editar propiedades de proyecto, objetivo o tarea
 */

export interface EditEntityInput {
  entityId: string;
  updates: Record<string, any>;
}

export interface EditResult {
  success: boolean;
  entityId?: string;
  updated?: string[];
  message?: string;
}

export class EditService {
  private static projects: Map<string, any> = new Map();
  private static objectives: Map<string, any> = new Map();
  private static tasks: Map<string, any> = new Map();

  static async editProject(input: EditEntityInput): Promise<EditResult> {
    if (!input.updates || Object.keys(input.updates).length === 0) {
      throw new Error('updates no puede estar vacío');
    }

    const validFields = ['projectName', 'description', 'priority'];
    for (const key of Object.keys(input.updates)) {
      if (!validFields.includes(key)) {
        throw new Error(`Campo inválido: ${key}`);
      }
    }

    const project = this.projects.get(input.entityId);
    if (!project) {
      throw new Error(`Proyecto ${input.entityId} no encontrado`);
    }

    const updated: string[] = [];
    for (const [key, value] of Object.entries(input.updates)) {
      project[key] = value;
      updated.push(key);
    }

    return {
      success: true,
      entityId: input.entityId,
      updated
    };
  }

  static async editObjective(input: EditEntityInput): Promise<EditResult> {
    if (!input.updates || Object.keys(input.updates).length === 0) {
      throw new Error('updates no puede estar vacío');
    }

    const objective = this.objectives.get(input.entityId);
    if (!objective) {
      throw new Error(`Objetivo ${input.entityId} no encontrado`);
    }

    const updated: string[] = [];
    for (const [key, value] of Object.entries(input.updates)) {
      objective[key] = value;
      updated.push(key);
    }

    return {
      success: true,
      entityId: input.entityId,
      updated
    };
  }

  static async editTask(input: EditEntityInput): Promise<EditResult> {
    if (!input.updates || Object.keys(input.updates).length === 0) {
      throw new Error('updates no puede estar vacío');
    }

    const task = this.tasks.get(input.entityId);
    if (!task) {
      throw new Error(`Tarea ${input.entityId} no encontrada`);
    }

    const updated: string[] = [];
    for (const [key, value] of Object.entries(input.updates)) {
      task[key] = value;
      updated.push(key);
    }

    return {
      success: true,
      entityId: input.entityId,
      updated
    };
  }

  static registerProject(id: string, data: any) {
    this.projects.set(id, data);
  }

  static registerObjective(id: string, data: any) {
    this.objectives.set(id, data);
  }

  static registerTask(id: string, data: any) {
    this.tasks.set(id, data);
  }
}

export const editService = {
  editProject: (input: EditEntityInput) => EditService.editProject(input),
  editObjective: (input: EditEntityInput) => EditService.editObjective(input),
  editTask: (input: EditEntityInput) => EditService.editTask(input)
};
