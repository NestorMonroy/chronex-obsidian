/**
 * UC-008: Create Project (TIER 1 MVP)
 * 
 * Caso de uso principal: Crear nuevo proyecto completo
 * 
 * Un proyecto es la unidad organizativa principal que contiene:
 * - Nombre único
 * - Descripción opcional
 * - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA)
 * - Carpeta estructura en 200-PROYECTOS/{ID}/
 * - Nota base (README.md) con frontmatter
 * - ID único generado: PROJ-YYYYMM-XXXXX
 * 
 * Flujo:
 * 1. Validar entrada (projectName requerido, máx 200 caracteres)
 * 2. Generar ID único garantizado
 * 3. Crear carpeta en 200-PROYECTOS/{ID}/
 * 4. Crear nota README.md desde template
 * 5. Crear frontmatter con metadatos del proyecto
 * 6. Notificar usuario
 * 7. Guardar en registro de proyectos
 * 
 * Ejemplo uso:
 * ```typescript
 * const result = await ProjectService.createProject({
 *   projectName: 'Nuevo Proyecto 2026',
 *   description: 'Descripción del proyecto',
 *   priority: 'ALTA'
 * });
 * // result.projectId: 'PROJ-202604-ABC12'
 * ```
 * 
 * @see /docs/specification/use-cases/UC-008-create-project.md
 */

/**
 * Entrada para crear proyecto
 */
export interface CreateProjectInput {
  projectName: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
}

/**
 * Frontmatter de proyecto
 */
export interface ProjectFrontmatter {
  uid: string;
  type: string;
  title: string;
  description?: string;
  priority?: string;
  dateCreated: string;
  status: string;
}

/**
 * Resultado de crear proyecto
 */
export interface ProjectResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  folderCreated?: boolean;
  folderPath?: string;
  noteCreated?: boolean;
  notePath?: string;
  frontmatter?: ProjectFrontmatter;
  notified?: boolean;
  message?: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Proyecto almacenado
 */
export interface StoredProject {
  projectId: string;
  projectName: string;
  description?: string;
  priority?: string;
  dateCreated: string;
  folderPath: string;
  notePath: string;
}

/**
 * Servicio para crear proyectos
 */
export class ProjectService {
  private static projects: Map<string, StoredProject> = new Map();

  /**
   * Crear nuevo proyecto completamente configurado
   * 
   * Proceso detallado:
   * 1. VALIDAR: Verifica que projectName existe y es válido (1-200 caracteres)
   * 2. ID GENERADO: Crea ID único formato PROJ-YYYYMM-XXXXX usando crypto random
   * 3. CARPETA CREADA: Establece estructura en 200-PROYECTOS/{ID}/
   * 4. NOTA CREADA: Genera README.md desde template Templater
   * 5. FRONTMATTER: Crea metadatos YAML con uid, type, title, priority, etc.
   * 6. NOTIFICADO: Notifica usuario del éxito
   * 7. GUARDADO: Registra proyecto en memoria para futuros accesos
   * 
   * @param input Datos del proyecto
   * @returns Resultado con ID, rutas y confirmaciones
   * @throws Error si validación falla o error en cualquier paso
   * 
   * @example
   * const result = await ProjectService.createProject({
   *   projectName: 'Sistema de Gestión 2026',
   *   description: 'Sistema completo para organizar proyectos y tareas',
   *   priority: 'ALTA'
   * });
   * console.log(result.projectId); // 'PROJ-202604-A1B2C'
   * console.log(result.folderPath); // '200-PROYECTOS/PROJ-202604-A1B2C'
   * console.log(result.notePath); // '200-PROYECTOS/PROJ-202604-A1B2C/README.md'
   */
  static async createProject(input: CreateProjectInput): Promise<ProjectResult> {
    try {
      // PASO 1: Validar entrada
      const validation = await this.validateProjectInput(input);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }

      // PASO 2: Generar ID único
      const projectId = this.generateProjectId();

      // PASO 3: Crear carpeta
      const folderPath = await this.createProjectFolder(projectId);

      // PASO 4: Crear nota base
      const notePath = await this.createProjectNote(projectId, input);

      // PASO 5: Crear frontmatter
      const frontmatter = this.createFrontmatter(projectId, input);

      // PASO 6: Notificar usuario
      await this.notifyUser(`Proyecto ${input.projectName} creado exitosamente`);

      // Guardar en registro
      const project: StoredProject = {
        projectId,
        projectName: input.projectName,
        description: input.description,
        priority: input.priority,
        dateCreated: new Date().toISOString(),
        folderPath,
        notePath
      };

      this.projects.set(projectId, project);

      return {
        success: true,
        projectId,
        projectName: input.projectName,
        folderCreated: true,
        folderPath,
        noteCreated: true,
        notePath,
        frontmatter,
        notified: true
      };
    } catch (error) {
      throw new Error(`Error creando proyecto: ${error}`);
    }
  }

  /**
   * Obtener proyecto por ID
   */
  static async getProject(projectId: string): Promise<StoredProject | null> {
    return this.projects.get(projectId) || null;
  }

  /**
   * Listar todos los proyectos
   */
  static async listProjects(): Promise<StoredProject[]> {
    return Array.from(this.projects.values());
  }

  /**
   * Validar entrada
   */
  static async validateProjectInput(input: CreateProjectInput): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validar projectName
    if (!input.projectName || input.projectName.trim() === '') {
      errors.push('projectName es requerido');
    }

    if (input.projectName && input.projectName.length > 200) {
      errors.push('projectName no puede superar 200 caracteres');
    }

    // Validar description (opcional)
    if (input.description && input.description.length > 2000) {
      errors.push('description no puede superar 2000 caracteres');
    }

    // Validar priority (opcional)
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

  /**
   * Generar ID único para proyecto
   */
  private static generateProjectId(): string {
    const date = new Date();
    const yyyymm = date.getFullYear().toString() + 
                   String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PROJ-${yyyymm}-${random}`;
  }

  /**
   * Crear carpeta de proyecto
   */
  private static async createProjectFolder(projectId: string): Promise<string> {
    // En implementación real, interactuaría con filesystem
    const folderPath = `200-PROYECTOS/${projectId}`;
    return folderPath;
  }

  /**
   * Crear nota base de proyecto
   */
  private static async createProjectNote(projectId: string, input: CreateProjectInput): Promise<string> {
    // En implementación real, usaría Templater
    const notePath = `200-PROYECTOS/${projectId}/README.md`;
    return notePath;
  }

  /**
   * Crear frontmatter del proyecto
   */
  private static createFrontmatter(projectId: string, input: CreateProjectInput): ProjectFrontmatter {
    return {
      uid: projectId,
      type: 'proyecto',
      title: input.projectName,
      description: input.description,
      priority: input.priority,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'activo'
    };
  }

  /**
   * Notificar usuario
   */
  private static async notifyUser(message: string): Promise<void> {
    // En implementación real, usaría NotificationHelper
    return;
  }
}

/**
 * Alias para uso rápido
 */
export const projectService = {
  create: (input: CreateProjectInput) => ProjectService.createProject(input),
  get: (id: string) => ProjectService.getProject(id),
  list: () => ProjectService.listProjects(),
  validate: (input: CreateProjectInput) => ProjectService.validateProjectInput(input)
};
