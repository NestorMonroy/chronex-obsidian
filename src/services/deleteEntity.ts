/**
 * UC-020: Delete Entity (TIER 1 MVP)
 * Permite eliminar proyecto, objetivo o tarea
 */

export interface DeleteResult {
  success: boolean;
  entityId?: string;
  message?: string;
}

export class DeleteService {
  private static projects: Map<string, any> = new Map();
  private static objectives: Map<string, any> = new Map();
  private static tasks: Map<string, any> = new Map();

  static async deleteProject(entityId: string): Promise<DeleteResult> {
    if (!this.projects.has(entityId)) {
      throw new Error(`Proyecto ${entityId} no encontrado`);
    }

    this.projects.delete(entityId);

    return {
      success: true,
      entityId,
      message: `Proyecto ${entityId} eliminado correctamente`
    };
  }

  static async deleteObjective(entityId: string): Promise<DeleteResult> {
    if (!this.objectives.has(entityId)) {
      throw new Error(`Objetivo ${entityId} no encontrado`);
    }

    this.objectives.delete(entityId);

    return {
      success: true,
      entityId,
      message: `Objetivo ${entityId} eliminado correctamente`
    };
  }

  static async deleteTask(entityId: string): Promise<DeleteResult> {
    if (!this.tasks.has(entityId)) {
      throw new Error(`Tarea ${entityId} no encontrada`);
    }

    this.tasks.delete(entityId);

    return {
      success: true,
      entityId,
      message: `Tarea ${entityId} eliminada correctamente`
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

export const deleteService = {
  deleteProject: (id: string) => DeleteService.deleteProject(id),
  deleteObjective: (id: string) => DeleteService.deleteObjective(id),
  deleteTask: (id: string) => DeleteService.deleteTask(id)
};
