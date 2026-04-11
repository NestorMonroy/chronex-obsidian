/**
 * UC-021: Archive Entity (TIER 1 MVP)
 * Permite archivar/desarchivar proyecto, objetivo o tarea
 */

export interface ArchiveResult {
  success: boolean;
  status?: string;
  archivedDate?: string;
  message?: string;
}

export class ArchiveService {
  private static projects: Map<string, any> = new Map();
  private static objectives: Map<string, any> = new Map();
  private static tasks: Map<string, any> = new Map();

  static async archiveProject(entityId: string): Promise<ArchiveResult> {
    if (!this.projects.has(entityId)) {
      throw new Error(`Proyecto ${entityId} no encontrado`);
    }

    const project = this.projects.get(entityId);
    project.status = 'archivado';
    project.archivedDate = new Date().toISOString().split('T')[0];

    return {
      success: true,
      status: 'archivado',
      archivedDate: project.archivedDate,
      message: `Proyecto ${entityId} archivado correctamente`
    };
  }

  static async unarchiveProject(entityId: string): Promise<ArchiveResult> {
    if (!this.projects.has(entityId)) {
      throw new Error(`Proyecto ${entityId} no encontrado`);
    }

    const project = this.projects.get(entityId);
    project.status = 'activo';
    delete project.archivedDate;

    return {
      success: true,
      status: 'activo',
      message: `Proyecto ${entityId} desarchivado correctamente`
    };
  }

  static async archiveObjective(entityId: string): Promise<ArchiveResult> {
    if (!this.objectives.has(entityId)) {
      throw new Error(`Objetivo ${entityId} no encontrado`);
    }

    const objective = this.objectives.get(entityId);
    objective.status = 'archivado';
    objective.archivedDate = new Date().toISOString().split('T')[0];

    return {
      success: true,
      status: 'archivado',
      archivedDate: objective.archivedDate
    };
  }

  static async archiveTask(entityId: string): Promise<ArchiveResult> {
    if (!this.tasks.has(entityId)) {
      throw new Error(`Tarea ${entityId} no encontrada`);
    }

    const task = this.tasks.get(entityId);
    task.status = 'archivado';
    task.archivedDate = new Date().toISOString().split('T')[0];

    return {
      success: true,
      status: 'archivado',
      archivedDate: task.archivedDate
    };
  }

  static async unarchiveTask(entityId: string): Promise<ArchiveResult> {
    if (!this.tasks.has(entityId)) {
      throw new Error(`Tarea ${entityId} no encontrada`);
    }

    const task = this.tasks.get(entityId);
    task.status = 'pendiente';
    delete task.archivedDate;

    return {
      success: true,
      status: 'pendiente'
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

export const archiveService = {
  archiveProject: (id: string) => ArchiveService.archiveProject(id),
  unarchiveProject: (id: string) => ArchiveService.unarchiveProject(id),
  archiveObjective: (id: string) => ArchiveService.archiveObjective(id),
  archiveTask: (id: string) => ArchiveService.archiveTask(id),
  unarchiveTask: (id: string) => ArchiveService.unarchiveTask(id)
};
