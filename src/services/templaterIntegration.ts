/**
 * UC-INT02: Integración con Templater
 * 
 * Sistema completo de integración con el plugin Templater de Obsidian:
 * 
 * Templater es un plugin que permite:
 * - Usar variables dinámicas: {{variableName}}
 * - Ejecutar funciones: {{tp.file.creation_date('YYYY-MM-DD')}}
 * - Lógica condicional: {% if ... %}
 * - Loops y más
 * 
 * Esta integración:
 * 1. Registra templates procesables por Templater
 * 2. Define variables requeridas para cada template
 * 3. Procesa templates con datos dinámicos
 * 4. Crea notas completas desde templates
 * 5. Valida syntax de templates
 * 6. Gestiona templates dinámicamente
 * 
 * Patrón: Registry pattern (mantener registro de templates en memoria/storage)
 * 
 * @see /docs/specification/use-cases/uc-int02-templater-integration.md
 */

/**
 * Configuración de un template procesable por Templater
 * 
 * Propiedades:
 * - id: Identificador único del template
 * - name: Nombre legible
 * - description: Descripción del template
 * - filePath: Ruta al archivo .md que contiene el template
 * - templateType: Tipo de entidad que crea (project, task, etc.)
 * - variables: Mapa de variables requeridas con descripciones
 */
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  filePath: string;
  templateType: 'project' | 'objective' | 'task' | 'document' | 'note';
  variables: Record<string, string>;
}

/**
 * Datos para procesar un template
 * Incluye valores para todas las variables requeridas
 */
export interface TemplateData {
  [key: string]: any;
}

/**
 * Resultado de registrar template
 */
export interface RegisterTemplateResult {
  success: boolean;
  templateId: string;
  message: string;
  variables: Record<string, string>;
}

/**
 * Resultado de procesar template
 */
export interface ProcessTemplateResult {
  success: boolean;
  processedContent: string;
}

/**
 * Resultado de crear nota desde template
 */
export interface CreateNoteResult {
  success: boolean;
  noteFileName: string;
  content: string;
}

/**
 * Resultado de validar syntax de template
 */
export interface ValidateSyntaxResult {
  valid: boolean;
  errors: string[];
  variables: string[];
}

/**
 * Gestor de integración con Templater
 * 
 * Responsabilidades:
 * - Registrar templates con validación
 * - Procesar templates con variables dinámicas
 * - Crear notas usando templates
 * - Validar syntax de templates
 * - Mantener registro de templates (registry pattern)
 */
export class TemplaterIntegration {
  private static templates: Map<string, TemplateConfig> = new Map();

  /**
   * Registrar un template en Templater
   * 
   * Proceso:
   * 1. Validar que ID es único
   * 2. Validar que file path existe
   * 3. Validar que tipo está en lista permitida
   * 4. Guardar template en registro
   * 
   * @param config Configuración del template a registrar
   * @returns Resultado con confirmación e información del template
   * @throws Error si config es inválida o ID ya existe
   * 
   * @example
   * const result = await TemplaterIntegration.registerTemplate({
   *   id: 'project-template',
   *   name: 'Project Template',
   *   description: 'Template para crear proyectos',
   *   filePath: '990-UTILIDADES/991-templates/project.md',
   *   templateType: 'project',
   *   variables: {
   *     projectName: 'Nombre del proyecto',
   *     description: 'Descripción general'
   *   }
   * });
   */
  static async registerTemplate(config: TemplateConfig): Promise<RegisterTemplateResult> {
    // Validar que ID existe
    if (!config.id || config.id.trim() === '') {
      throw new Error('Template ID es requerido');
    }

    // Validar que filePath existe
    if (!config.filePath || config.filePath.trim() === '') {
      throw new Error('File path es requerido');
    }

    // Validar que tipo es válido
    const validTypes = ['project', 'objective', 'task', 'document', 'note'];
    if (!validTypes.includes(config.templateType)) {
      throw new Error(`Template type debe ser uno de: ${validTypes.join(', ')}`);
    }

    // Validar unicidad: no permitir IDs duplicados
    if (this.templates.has(config.id)) {
      throw new Error(`Template con ID '${config.id}' ya existe`);
    }

    // Guardar template en el registro
    this.templates.set(config.id, config);

    return {
      success: true,
      templateId: config.id,
      message: `Template '${config.name}' registrado exitosamente`,
      variables: config.variables
    };
  }

  /**
   * Procesar template con variables dinámicas
   * 
   * Proceso:
   * 1. Validar que template existe
   * 2. Validar que todas las variables requeridas están presentes
   * 3. Reemplazar {{variableName}} con valores
   * 4. Retornar contenido procesado
   * 
   * @param templateId ID del template a procesar
   * @param data Valores para las variables del template
   * @returns Contenido procesado
   * @throws Error si template no existe o faltan variables
   * 
   * @example
   * const result = await TemplaterIntegration.processTemplate('project-template', {
   *   projectName: 'Mi Nuevo Proyecto',
   *   description: 'Un proyecto muy importante'
   * });
   */
  static async processTemplate(
    templateId: string,
    data: TemplateData
  ): Promise<ProcessTemplateResult> {
    // Validar que template existe
    if (!this.templates.has(templateId)) {
      throw new Error(`Template '${templateId}' no encontrado`);
    }

    const template = this.templates.get(templateId)!;

    // Validar que todas las variables requeridas están presentes
    for (const varName of Object.keys(template.variables)) {
      if (!(varName in data)) {
        throw new Error(`Variable requerida '${varName}' no proporcionada`);
      }
    }

    // Procesar template (simulado)
    // En implementación real, usaría Templater API
    let processedContent = `Template: ${template.name}\n`;
    processedContent += `Type: ${template.templateType}\n`;
    processedContent += `\n`;
    for (const [key, value] of Object.entries(data)) {
      processedContent += `${key}: ${value}\n`;
    }

    return {
      success: true,
      processedContent
    };
  }

  /**
   * Crear nota completa desde template
   * 
   * Combina registro + procesamiento para crear una nota lista para usar
   * 
   * @param templateId ID del template a usar
   * @param fileName Nombre del archivo de la nota a crear
   * @param data Valores para las variables
   * @returns Nota creada con contenido procesado
   * @throws Error si template no existe, fileName vacío, o faltan variables
   */
  static async createNoteFromTemplate(
    templateId: string,
    fileName: string,
    data: TemplateData
  ): Promise<CreateNoteResult> {
    // Validar fileName
    if (!fileName || fileName.trim() === '') {
      throw new Error('File name es requerido');
    }

    // Procesar template
    const processResult = await this.processTemplate(templateId, data);

    return {
      success: true,
      noteFileName: fileName,
      content: processResult.processedContent
    };
  }

  /**
   * Validar syntax de un template
   * 
   * Verifica:
   * - Variables cerradas correctamente: {{var}} ✓ vs {{var ✗
   * - Delimitadores consistentes
   * - Extrae lista de variables encontradas
   * 
   * @param content Contenido del template a validar
   * @returns Resultado con errores (si hay) y variables encontradas
   * 
   * @example
   * const result = await TemplaterIntegration.validateTemplateSyntax(
   *   '# {{projectName}}\n\n{{description}}'
   * );
   * // { valid: true, errors: [], variables: ['projectName', 'description'] }
   */
  static async validateTemplateSyntax(content: string): Promise<ValidateSyntaxResult> {
    const errors: string[] = [];
    const variables: string[] = [];

    // Encontrar todas las variables: {{...}}
    const varRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = varRegex.exec(content)) !== null) {
      variables.push(match[1]);
    }

    // Validar que no hay aperturas sin cerrar
    const openCount = (content.match(/\{\{/g) || []).length;
    const closeCount = (content.match(/\}\}/g) || []).length;

    if (openCount !== closeCount) {
      errors.push('Variables no cerradas correctamente');
    }

    // Validar que no hay delimitadores incompletos
    if (/\{\{\{|\}\}\}/.test(content)) {
      errors.push('Delimitadores inconsistentes encontrados');
    }

    return {
      valid: errors.length === 0,
      errors,
      variables
    };
  }

  /**
   * Listar todos los templates registrados
   * 
   * @returns Array con todos los templates en el sistema
   */
  static async listTemplates(): Promise<TemplateConfig[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Desregistrar template existente
   * 
   * @param templateId ID del template a desregistrar
   * @returns Confirmación de desregistro
   * @throws Error si template no existe
   */
  static async unregisterTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
    // Validar que existe
    if (!this.templates.has(templateId)) {
      throw new Error(`Template '${templateId}' no encontrado`);
    }

    const template = this.templates.get(templateId)!;
    this.templates.delete(templateId);

    return {
      success: true,
      message: `Template '${template.name}' removido exitosamente`
    };
  }
}

/**
 * Alias para uso rápido sin necesidad de escribir TemplaterIntegration cada vez
 */
export const templaterIntegration = {
  registerTemplate: (config: TemplateConfig) => TemplaterIntegration.registerTemplate(config),
  processTemplate: (id: string, data: TemplateData) => TemplaterIntegration.processTemplate(id, data),
  createNote: (id: string, fileName: string, data: TemplateData) => 
    TemplaterIntegration.createNoteFromTemplate(id, fileName, data),
  validateSyntax: (content: string) => TemplaterIntegration.validateTemplateSyntax(content),
  listTemplates: () => TemplaterIntegration.listTemplates(),
  unregisterTemplate: (id: string) => TemplaterIntegration.unregisterTemplate(id)
};
