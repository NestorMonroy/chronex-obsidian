/**
 * UC-012: Create Task (TIER 1 MVP)
 */

export interface CreateTaskInput {
  taskName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  dueDate?: string;
}

export interface TaskFrontmatter {
  uid: string;
  type: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  dateCreated: string;
  status: string;
}

export interface TaskResult {
  success: boolean;
  taskId?: string;
  taskName?: string;
  noteCreated?: boolean;
  notePath?: string;
  frontmatter?: TaskFrontmatter;
  notified?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface StoredTask {
  taskId: string;
  taskName: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  dateCreated: string;
  notePath: string;
}

export class TaskService {
  private static tasks: Map<string, StoredTask> = new Map();

  static async createTask(input: CreateTaskInput): Promise<TaskResult> {
    try {
      const validation = await this.validateTaskInput(input);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }

      const taskId = this.generateTaskId();
      const notePath = await this.createTaskNote(taskId, input);
      const frontmatter = this.createFrontmatter(taskId, input);

      await this.notifyUser(`Tarea ${input.taskName} creada exitosamente`);

      const task: StoredTask = {
        taskId,
        taskName: input.taskName,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        dateCreated: new Date().toISOString(),
        notePath
      };

      this.tasks.set(taskId, task);

      return {
        success: true,
        taskId,
        taskName: input.taskName,
        noteCreated: true,
        notePath,
        frontmatter,
        notified: true
      };
    } catch (error) {
      throw new Error(`Error creando tarea: ${error}`);
    }
  }

  static async getTask(taskId: string): Promise<StoredTask | null> {
    return this.tasks.get(taskId) || null;
  }

  static async listTasks(): Promise<StoredTask[]> {
    return Array.from(this.tasks.values());
  }

  static async validateTaskInput(input: CreateTaskInput): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!input.taskName || input.taskName.trim() === '') {
      errors.push('taskName es requerido');
    }

    if (input.taskName && input.taskName.length > 200) {
      errors.push('taskName no puede superar 200 caracteres');
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

    if (input.dueDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input.dueDate)) {
        errors.push('dueDate debe tener formato YYYY-MM-DD');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static generateTaskId(): string {
    const date = new Date();
    const yyyymm = date.getFullYear().toString() + 
                   String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TSK-${yyyymm}-${random}`;
  }

  private static async createTaskNote(taskId: string, input: CreateTaskInput): Promise<string> {
    const notePath = `200-PROYECTOS/tareas/${taskId}/README.md`;
    return notePath;
  }

  private static createFrontmatter(taskId: string, input: CreateTaskInput): TaskFrontmatter {
    return {
      uid: taskId,
      type: 'tarea',
      title: input.taskName,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'pendiente'
    };
  }

  private static async notifyUser(message: string): Promise<void> {
    return;
  }
}

export const taskService = {
  create: (input: CreateTaskInput) => TaskService.createTask(input),
  get: (id: string) => TaskService.getTask(id),
  list: () => TaskService.listTasks(),
  validate: (input: CreateTaskInput) => TaskService.validateTaskInput(input)
};
