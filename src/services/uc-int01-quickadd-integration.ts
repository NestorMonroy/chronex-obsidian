/**
 * UC-INT01: Integración con QuickAdd
 * 
 * Sistema completo de integración con el plugin QuickAdd de Obsidian:
 * 
 * QuickAdd es un plugin que permite automatizar tareas repetitivas mediante:
 * - Macros: Scripts ejecutables con keybindings personalizados
 * - Triggers: Atajos de teclado para ejecutar macros
 * - Templates: Scripts pre-hechos para crear diferentes tipos de notas
 * 
 * Esta integración:
 * 1. Registra macros personalizados (create-project, create-task, etc.)
 * 2. Define templates de scripts para cada tipo de entidad
 * 3. Asocia triggers (cmd+shift+p, etc.) a cada macro
 * 4. Ejecuta macros con variables dinámicas
 * 5. Permite agregar/remover macros dinámicamente
 * 
 * Patrón: Registry pattern (mantener registro de macros en memoria/storage)
 * 
 * @see /docs/specification/use-cases/uc-int01-quickadd-integration.md
 */

/**
 * Configuración de un macro ejecutable en QuickAdd
 * 
 * Propiedades:
 * - id: Identificador único del macro (create-project, create-task, etc.)
 * - name: Nombre visible en la interfaz
 * - description: Explicación de qué hace el macro
 * - trigger: Keybinding (cmd+shift+p, alt+t, etc.)
 * - scriptPath: Ruta al archivo JavaScript que ejecuta el macro
 */
export interface MacroConfig {
  id: string;
  name: string;
  description: string;
  trigger: string;
  scriptPath: string;
}

/**
 * Template de script para un tipo de entidad
 * 
 * Define la estructura y variables para crear automáticamente
 * notas de un tipo específico (proyecto, objetivo, tarea, etc.)
 */
export interface ScriptTemplate {
  type: 'project' | 'objective' | 'task' | 'document' | 'note';
  name: string;
  variables: Record<string, string>;
  scriptCode: string;
}

/**
 * Resultado de registrar macro
 */
export interface RegisterMacroResult {
  success: boolean;
  macroId: string;
  message: string;
}

/**
 * Resultado de crear template
 */
export interface CreateTemplateResult {
  success: boolean;
  templateId: string;
  variables: Record<string, string>;
}

/**
 * Resultado de ejecutar macro
 */
export interface ExecuteMacroResult {
  success: boolean;
  macroId: string;
  output?: any;
  variablesPassed?: Record<string, any>;
}

/**
 * Resultado de registrar macros por defecto
 */
export interface RegisterDefaultMacrosResult {
  success: boolean;
  macrosRegistered: number;
  macroIds: string[];
  message: string;
}

/**
 * Gestor de integración con QuickAdd
 * 
 * Responsabilidades:
 * - Registrar macros con validación
 * - Crear y gestionar templates de scripts
 * - Ejecutar macros con variables
 * - Mantener registro de macros (registry pattern)
 */
export class QuickAddIntegration {
  private static macros: Map<string, MacroConfig> = new Map();
  private static templates: Map<string, ScriptTemplate> = new Map();

  /**
   * Registrar un macro en QuickAdd
   * 
   * Proceso:
   * 1. Validar que macro ID es único
   * 2. Validar que script path existe
   * 3. Validar que trigger tiene formato correcto
   * 4. Guardar macro en registro
   * 
   * @param config Configuración del macro a registrar
   * @returns Resultado con confirmación e información del macro
   * @throws Error si config es inválida o ID ya existe
   * 
   * @example
   * const result = await QuickAddIntegration.registerMacro({
   *   id: 'create-project',
   *   name: 'Crear Proyecto',
   *   description: 'Crear nuevo proyecto en 200-PROYECTOS',
   *   trigger: 'cmd+shift+p',
   *   scriptPath: '990-UTILIDADES/992-script/create-project.js'
   * });
   */
  static async registerMacro(config: MacroConfig): Promise<RegisterMacroResult> {
    // Validar que macro ID existe
    if (!config.id || config.id.trim() === '') {
      throw new Error('Macro ID es requerido');
    }

    // Validar que script path existe
    if (!config.scriptPath || config.scriptPath.trim() === '') {
      throw new Error('Script path es requerido');
    }

    // Validar unicidad: no permitir IDs duplicados
    if (this.macros.has(config.id)) {
      throw new Error(`Macro con ID '${config.id}' ya existe`);
    }

    // Validar formato de trigger (cmd+k, alt+a, cmd+shift+n, etc.)
    if (!this.isValidTrigger(config.trigger)) {
      throw new Error('Trigger debe tener formato válido (ej: cmd+k, alt+a, cmd+shift+n)');
    }

    // Guardar macro en el registro
    this.macros.set(config.id, config);

    return {
      success: true,
      macroId: config.id,
      message: `Macro '${config.name}' registrado exitosamente`
    };
  }

  /**
   * Crear template de script para tipo de entidad
   * 
   * Los templates definen la estructura y variables para crear
   * automáticamente notas de un tipo específico
   * 
   * @param template Template a crear
   * @returns Resultado con ID único del template
   * @throws Error si tipo de template no es válido
   */
  static async createScriptTemplate(template: ScriptTemplate): Promise<CreateTemplateResult> {
    // Validar que tipo es válido
    const validTypes = ['project', 'objective', 'task', 'document', 'note'];
    if (!validTypes.includes(template.type)) {
      throw new Error(`Tipo de template inválido. Debe ser: ${validTypes.join(', ')}`);
    }

    // Generar ID único para template
    const templateId = `${template.type}-${Date.now()}`;

    // Guardar template en el registro
    this.templates.set(templateId, template);

    return {
      success: true,
      templateId,
      variables: template.variables
    };
  }

  /**
   * Registrar todos los macros por defecto del sistema
   * 
   * Registra automáticamente los 5 macros principales:
   * - create-project (cmd+shift+p)
   * - create-objective (cmd+shift+o)
   * - create-task (cmd+shift+t)
   * - create-document (cmd+shift+d)
   * - create-fleeting-note (cmd+shift+n)
   * 
   * @returns Resultado con lista de macros registrados
   */
  static async registerDefaultMacros(): Promise<RegisterDefaultMacrosResult> {
    const defaultMacros: MacroConfig[] = [
      {
        id: 'create-project',
        name: 'Crear Proyecto',
        description: 'Crear nuevo proyecto en 200-PROYECTOS',
        trigger: 'cmd+shift+p',
        scriptPath: '990-UTILIDADES/992-script/create-project.js'
      },
      {
        id: 'create-objective',
        name: 'Crear Objetivo',
        description: 'Crear nuevo objetivo en proyecto',
        trigger: 'cmd+shift+o',
        scriptPath: '990-UTILIDADES/992-script/create-objective.js'
      },
      {
        id: 'create-task',
        name: 'Crear Tarea',
        description: 'Crear nueva tarea en objetivo',
        trigger: 'cmd+shift+t',
        scriptPath: '990-UTILIDADES/992-script/create-task.js'
      },
      {
        id: 'create-document',
        name: 'Crear Documento',
        description: 'Crear nuevo documento en 500-REPOSITORIOS',
        trigger: 'cmd+shift+d',
        scriptPath: '990-UTILIDADES/992-script/create-document.js'
      },
      {
        id: 'create-fleeting-note',
        name: 'Crear Nota Rápida',
        description: 'Crear nueva nota en 100-INBOX',
        trigger: 'cmd+shift+n',
        scriptPath: '990-UTILIDADES/992-script/create-fleeting-note.js'
      }
    ];

    const macroIds: string[] = [];
    for (const macro of defaultMacros) {
      try {
        const result = await this.registerMacro(macro);
        macroIds.push(result.macroId);
      } catch (error) {
        // Si ya existe, continuar
        if (error instanceof Error && error.message.includes('ya existe')) {
          macroIds.push(macro.id);
        }
      }
    }

    return {
      success: true,
      macrosRegistered: macroIds.length,
      macroIds,
      message: `Registro de macros completado exitosamente`
    };
  }

  /**
   * Listar todos los macros registrados
   * 
   * @returns Array con todos los macros en el sistema
   */
  static async listMacros(): Promise<MacroConfig[]> {
    return Array.from(this.macros.values());
  }

  /**
   * Ejecutar macro registrado con variables dinámicas
   * 
   * Proceso:
   * 1. Validar que macro existe
   * 2. Cargar configuración del macro
   * 3. Pasar variables al script
   * 4. Ejecutar script
   * 5. Retornar resultado
   * 
   * @param macroId ID del macro a ejecutar
   * @param variables Variables dinámicas para pasar al script
   * @returns Resultado de ejecución
   * @throws Error si macro no existe
   * 
   * @example
   * const result = await QuickAddIntegration.executeMacro('create-project', {
   *   projectName: 'Mi Nuevo Proyecto',
   *   description: 'Descripción del proyecto'
   * });
   */
  static async executeMacro(
    macroId: string,
    variables: Record<string, any> = {}
  ): Promise<ExecuteMacroResult> {
    // Validar que macro existe
    if (!this.macros.has(macroId)) {
      throw new Error(`Macro '${macroId}' no encontrado`);
    }

    const macro = this.macros.get(macroId)!;

    // En implementación real, ejecutaría el script del macro
    // con las variables pasadas como parámetros
    // Por ahora, simular ejecución exitosa
    return {
      success: true,
      macroId,
      output: `Macro ${macro.name} ejecutado`,
      variablesPassed: variables
    };
  }

  /**
   * Desregistrar macro existente
   * 
   * @param macroId ID del macro a desregistrar
   * @returns Confirmación de desregistro
   * @throws Error si macro no existe
   */
  static async unregisterMacro(macroId: string): Promise<{ success: boolean; message: string }> {
    // Validar que macro existe
    if (!this.macros.has(macroId)) {
      throw new Error(`Macro '${macroId}' no encontrado`);
    }

    const macro = this.macros.get(macroId)!;
    this.macros.delete(macroId);

    return {
      success: true,
      message: `Macro '${macro.name}' removido exitosamente`
    };
  }

  /**
   * Validar formato de trigger (keybinding)
   * 
   * Formatos válidos:
   * - cmd+k (Cmd + una letra/número)
   * - alt+a (Alt + una letra/número)
   * - ctrl+x (Ctrl + una letra/número)
   * - cmd+shift+n (Cmd + Shift + una letra/número)
   * - alt+shift+p (Alt + Shift + una letra/número)
   */
  private static isValidTrigger(trigger: string): boolean {
    // Patrón 1: cmd+k, alt+a, ctrl+x, shift+s
    const triggerRegex = /^(cmd|alt|ctrl|shift)\+([a-z]|\d)$/i;
    // Patrón 2: cmd+shift+n, alt+shift+p, etc.
    const shiftTriggerRegex = /^(cmd|alt|ctrl)\+shift\+([a-z]|\d)$/i;

    return triggerRegex.test(trigger) || shiftTriggerRegex.test(trigger);
  }
}

/**
 * Alias para uso rápido sin necesidad de escribir QuickAddIntegration cada vez
 */
export const quickAddIntegration = {
  registerMacro: (config: MacroConfig) => QuickAddIntegration.registerMacro(config),
  createTemplate: (template: ScriptTemplate) => QuickAddIntegration.createScriptTemplate(template),
  registerDefaults: () => QuickAddIntegration.registerDefaultMacros(),
  listMacros: () => QuickAddIntegration.listMacros(),
  execute: (id: string, vars?: Record<string, any>) => QuickAddIntegration.executeMacro(id, vars),
  unregister: (id: string) => QuickAddIntegration.unregisterMacro(id)
};
