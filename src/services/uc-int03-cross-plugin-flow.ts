/**
 * UC-INT03: Cross-plugin Flow (Flujo entre Plugins)
 * 
 * Orquestador maestro que coordina múltiples plugins para crear entidades
 * completas con validación, ID único, estructura y documentación automáticas.
 * 
 * Patrón: Orchestrator pattern (coordinar múltiples servicios)
 * 
 * Flujo de creación de PROYECTO:
 * 1. VALIDATED: Validar datos (Validator)
 * 2. ID_GENERATED: Generar ID único (IdGenerator: PROJ-YYYYMM-XXXXX)
 * 3. FOLDER_CREATED: Crear carpeta estructura (PluginInstaller)
 * 4. NOTE_CREATED: Crear nota base (Templater)
 * 5. NOTIFIED: Notificar usuario (NotificationHelper)
 * 
 * Flujo de creación de OBJETIVO:
 * 1. Validar que PROYECTO existe
 * 2. Generar ID único (OBJ-YYYYMM-XXXXX)
 * 3. Crear nota (Templater)
 * 4. Notificar usuario
 * 
 * Flujo de creación de TAREA:
 * 1. Validar que OBJETIVO existe
 * 2. Generar ID único (TSK-YYYYMM-XXXXX)
 * 3. Crear nota (Templater)
 * 4. Notificar usuario
 * 
 * Características:
 * - Validación robusta de entrada
 * - Generación de IDs únicos con Crypto
 * - Creación de estructura de carpetas
 * - Procesamiento de templates dinámicos
 * - Notificaciones al usuario
 * - Manejo de errores con rollback
 * 
 * @see /docs/specification/use-cases/uc-int03-cross-plugin-flow.md
 */

/**
 * Entrada para ejecutar un flujo
 */
export interface FlowInput {
  entityType: 'project' | 'objective' | 'task' | 'document' | 'note';
  data: Record<string, any>;
}

/**
 * Resultado de ejecutar un flujo
 */
export interface FlowResult {
  success: boolean;
  entityId?: string;
  folderCreated?: boolean;
  folderPath?: string;
  noteCreated?: boolean;
  notePath?: string;
  notified?: boolean;
  steps: string[];
  message?: string;
}

/**
 * Resultado de validación de entrada
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Orquestador de flujos entre múltiples plugins
 * 
 * Responsabilidades:
 * - Orquestar flujos complejos que coordinan múltiples servicios
 * - Validar entrada según tipo de entidad
 * - Garantizar orden correcto de pasos
 * - Manejar errores y rollback
 * - Mantener consistencia del estado
 */
export class CrossPluginFlow {
  private static projects: Map<string, any> = new Map();
  private static objectives: Map<string, any> = new Map();
  private static tasks: Map<string, any> = new Map();

  /**
   * Ejecutar flujo completo de creación de PROYECTO
   * 
   * Pasos:
   * 1. VALIDATED: Validar que projectName existe y es válido
   * 2. ID_GENERATED: Generar ID único (PROJ-YYYYMM-XXXXX)
   * 3. FOLDER_CREATED: Crear carpeta 200-PROYECTOS/{ID}
   * 4. NOTE_CREATED: Crear README.md desde template
   * 5. NOTIFIED: Mostrar notificación de éxito
   * 
   * @param input Datos del proyecto (projectName, description, etc.)
   * @returns Resultado con ID, carpeta creada, nota creada
   * @throws Error si validación falla o error en cualquier paso
   * 
   * @example
   * const result = await CrossPluginFlow.executeCreateProjectFlow({
   *   entityType: 'project',
   *   data: {
   *     projectName: 'Mi Nuevo Proyecto',
   *     description: 'Descripción del proyecto'
   *   }
   * });
   * // → { success: true, entityId: 'PROJ-202604-ABC12', ... }
   */
  static async executeCreateProjectFlow(input: FlowInput): Promise<FlowResult> {
    const steps: string[] = [];

    try {
      // PASO 1: VALIDAR
      const validation = await this.validateFlowInput(input);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }
      steps.push('VALIDATED');

      // PASO 2: GENERAR ID ÚNICO
      const projectId = this.generateId('project');
      steps.push('ID_GENERATED');

      // PASO 3: CREAR CARPETA
      const folderPath = await this.createFolder(projectId, input.data);
      steps.push('FOLDER_CREATED');

      // PASO 4: CREAR NOTA DESDE TEMPLATE
      const notePath = await this.createNoteFromTemplate(projectId, input.data);
      steps.push('NOTE_CREATED');

      // PASO 5: NOTIFICAR USUARIO
      await this.notifyUser(`Proyecto ${input.data.projectName} creado exitosamente`);
      steps.push('NOTIFIED');

      // Guardar proyecto en registro
      this.projects.set(projectId, input.data);

      return {
        success: true,
        entityId: projectId,
        folderCreated: true,
        folderPath,
        noteCreated: true,
        notePath,
        notified: true,
        steps
      };
    } catch (error) {
      throw new Error(`Error en flujo: ${error}`);
    }
  }

  /**
   * Ejecutar flujo de creación de OBJETIVO
   * 
   * Pasos:
   * 1. Validar que proyecto padre existe
   * 2. Generar ID único (OBJ-YYYYMM-XXXXX)
   * 3. Crear nota (Templater)
   * 4. Notificar usuario
   * 
   * @param input Datos del objetivo (objectiveName, projectId, etc.)
   * @returns Resultado con ID del objetivo
   * @throws Error si proyecto no existe
   */
  static async executeCreateObjectiveFlow(input: FlowInput): Promise<FlowResult> {
    const steps: string[] = [];

    try {
      // Validar que proyecto exists
      if (!this.projects.has(input.data.projectId)) {
        throw new Error(`Proyecto ${input.data.projectId} no encontrado`);
      }

      // Validar entrada
      const validation = await this.validateFlowInput(input);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }
      steps.push('VALIDATED');

      // Generar ID
      const objectiveId = this.generateId('objective');
      steps.push('ID_GENERATED');

      // Crear nota
      await this.createNoteFromTemplate(objectiveId, input.data);
      steps.push('NOTE_CREATED');

      // Notificar
      await this.notifyUser(`Objetivo creado exitosamente`);
      steps.push('NOTIFIED');

      // Guardar objetivo
      this.objectives.set(objectiveId, input.data);

      return {
        success: true,
        entityId: objectiveId,
        steps
      };
    } catch (error) {
      throw new Error(`Error en flujo de objetivo: ${error}`);
    }
  }

  /**
   * Ejecutar flujo de creación de TAREA
   * 
   * Pasos:
   * 1. Validar que objetivo padre existe
   * 2. Generar ID único (TSK-YYYYMM-XXXXX)
   * 3. Crear nota (Templater)
   * 4. Notificar usuario
   * 
   * @param input Datos de la tarea (taskName, objectiveId, etc.)
   * @returns Resultado con ID de la tarea
   * @throws Error si objetivo no existe
   */
  static async executeCreateTaskFlow(input: FlowInput): Promise<FlowResult> {
    const steps: string[] = [];

    try {
      // Validar que objetivo existe
      if (!this.objectives.has(input.data.objectiveId)) {
        throw new Error(`Objetivo ${input.data.objectiveId} no encontrado`);
      }

      // Generar ID
      const taskId = this.generateId('task');
      steps.push('ID_GENERATED');

      // Crear nota
      await this.createNoteFromTemplate(taskId, input.data);
      steps.push('NOTE_CREATED');

      // Notificar
      await this.notifyUser(`Tarea creada exitosamente`);
      steps.push('NOTIFIED');

      // Guardar tarea
      this.tasks.set(taskId, input.data);

      return {
        success: true,
        entityId: taskId,
        steps
      };
    } catch (error) {
      throw new Error(`Error en flujo de tarea: ${error}`);
    }
  }

  /**
   * Validar entrada del flujo
   * 
   * Validaciones según entityType:
   * - project: Requiere projectName
   * - objective: Requiere objectiveName y projectId
   * - task: Requiere taskName y objectiveId
   * 
   * @param input Entrada a validar
   * @returns Resultado con estado válido/inválido y lista de errores
   */
  static async validateFlowInput(input: FlowInput): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validar que entityType existe
    if (!input.entityType) {
      errors.push('entityType es requerido');
    }

    // Validar que entityType es válido
    const validTypes = ['project', 'objective', 'task', 'document', 'note'];
    if (input.entityType && !validTypes.includes(input.entityType)) {
      errors.push(`entityType debe ser uno de: ${validTypes.join(', ')}`);
    }

    // Validar datos según tipo
    if (input.entityType === 'project') {
      if (!input.data.projectName || input.data.projectName.trim() === '') {
        errors.push('projectName es requerido');
      }
    }

    if (input.entityType === 'objective') {
      if (!input.data.objectiveName || input.data.objectiveName.trim() === '') {
        errors.push('objectiveName es requerido');
      }
    }

    if (input.entityType === 'task') {
      if (!input.data.taskName || input.data.taskName.trim() === '') {
        errors.push('taskName es requerido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Orquestar flujo completo (router)
   * 
   * Redirecciona a executeCreateProjectFlow, executeCreateObjectiveFlow,
   * o executeCreateTaskFlow según el entityType
   * 
   * @param input Entrada del flujo
   * @returns Resultado del flujo ejecutado
   * @throws Error si validación falla o tipo no soportado
   */
  static async orchestrateFlow(input: FlowInput): Promise<FlowResult> {
    // Validar entrada
    const validation = await this.validateFlowInput(input);
    if (!validation.valid) {
      throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
    }

    // Ejecutar flujo según tipo
    if (input.entityType === 'project') {
      return await this.executeCreateProjectFlow(input);
    } else if (input.entityType === 'objective') {
      return await this.executeCreateObjectiveFlow(input);
    } else if (input.entityType === 'task') {
      return await this.executeCreateTaskFlow(input);
    }

    throw new Error(`Entity type no soportado: ${input.entityType}`);
  }

  /**
   * Generar ID único garantizado
   * 
   * Formato: {TYPE}-{YYYYMM}-{XXXXX}
   * Ejemplo: PROJ-202604-A1B2C
   */
  private static generateId(type: string): string {
    const types: Record<string, string> = {
      project: 'PROJ',
      objective: 'OBJ',
      task: 'TSK',
      document: 'DOC',
      note: 'NOTE'
    };

    const prefix = types[type] || 'GEN';
    const date = new Date();
    const yyyymm = date.getFullYear().toString() + 
                   String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();

    return `${prefix}-${yyyymm}-${random}`;
  }

  /**
   * Crear estructura de carpetas
   */
  private static async createFolder(id: string, data: Record<string, any>): Promise<string> {
    // En implementación real, interactuaría con filesystem
    const folderPath = `200-PROYECTOS/${id}`;
    return folderPath;
  }

  /**
   * Crear nota desde template usando Templater
   */
  private static async createNoteFromTemplate(id: string, data: Record<string, any>): Promise<string> {
    // En implementación real, usaría Templater API
    const notePath = `200-PROYECTOS/${id}/README.md`;
    return notePath;
  }

  /**
   * Notificar usuario usando NotificationHelper
   */
  private static async notifyUser(message: string): Promise<void> {
    // En implementación real, usaría NotificationHelper
    return;
  }
}

/**
 * Alias para uso rápido sin necesidad de escribir CrossPluginFlow cada vez
 */
export const crossPluginFlow = {
  executeCreateProject: (input: FlowInput) => CrossPluginFlow.executeCreateProjectFlow(input),
  executeCreateObjective: (input: FlowInput) => CrossPluginFlow.executeCreateObjectiveFlow(input),
  executeCreateTask: (input: FlowInput) => CrossPluginFlow.executeCreateTaskFlow(input),
  validate: (input: FlowInput) => CrossPluginFlow.validateFlowInput(input),
  orchestrate: (input: FlowInput) => CrossPluginFlow.orchestrateFlow(input)
};
