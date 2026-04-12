/**
 * ActionHandler - Sistema Central de Acciones para Botones
 *
 * Centraliza todas las acciones disponibles en el plugin, especialmente
 * diseñado para ser usado por el sistema de botones (button://).
 *
 * Acciones soportadas:
 * - Crear (proyectos, objetivos, tareas, documentos)
 * - Editar entidades
 * - Eliminar entidades
 * - Completar tareas
 * - Archivar entidades
 *
 * Este handler es usado por:
 * 1. ButtonHandler (button:// URIs) - PRIMARY
 * 2. CommandHandler (comandos Obsidian) - Secundario
 * 3. Integraciones externas (QuickAdd, Templater) - Opcional
 *
 * Patrón: Facade Pattern + Adapter Pattern
 * - Simplifica la interfaz de los servicios para los botones
 * - Delega a los servicios WithVault internamente
 * - Maneja errores y notificaciones de forma centralizada
 */

import { App, Notice } from 'obsidian';
import { ProjectServiceWithVault } from './projectServiceWithVault';
import { ObjectiveServiceWithVault } from './objectiveServiceWithVault';
import { TaskServiceWithVault } from './taskServiceWithVault';
import { DocumentServiceWithVault } from './documentServiceWithVault';

/**
 * Parámetros para crear una entidad
 *
 * Parámetros mínimos requeridos para crear cualquier tipo de entidad.
 * Los parámetros específicos dependen del `type`:
 *
 * - project: name, priority (opcional), description (opcional)
 * - objective: name, priority (opcional), description (opcional)
 * - task: name, priority (opcional), description (opcional), dueDate (opcional)
 * - document: name, description (opcional)
 */
export interface CreateActionParams {
  type: 'project' | 'objective' | 'task' | 'document';
  name?: string;
  title?: string;
  description?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  dueDate?: string;
  parentId?: string;
  [key: string]: any;
}

/**
 * Parámetros para editar una entidad
 *
 * Nota: Los botones pueden editar entidades, pero la implementación
 * completa de editEntityWithVault requiere más contexto.
 * Por ahora, ActionHandler soporta ediciones simples.
 */
export interface EditActionParams {
  uid: string;
  updates: Record<string, any>;
}

/**
 * Parámetros para eliminar una entidad
 */
export interface DeleteActionParams {
  uid: string;
  permanent?: boolean;
}

/**
 * Parámetros para archivar una entidad
 */
export interface ArchiveActionParams {
  uid: string;
}

/**
 * Parámetros para completar una tarea
 */
export interface CompleteActionParams {
  uid: string;
}

/**
 * Resultado genérico de una acción
 *
 * Todas las acciones retornan este formato:
 * - success: boolean indicando si la acción se completó
 * - message: Mensaje descriptivo (para mostrar al usuario)
 * - data: Datos adicionales de la acción (opcional)
 * - error: Código o descripción del error (si success=false)
 */
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Handler centralizado de acciones
 *
 * NOTA sobre la arquitectura:
 * ActionHandler es un ADAPTER que expone una interfaz simple para los botones,
 * pero delega a los servicios WithVault internamente. Algunos servicios requieren
 * más contexto (entityType, folderPath) que ActionHandler obtiene del UID.
 *
 * En implementaciones futuras, se puede mejorar para obtener este contexto
 * del .index.json o de un servicio de búsqueda de entidades.
 */
export class ActionHandler {
  constructor(private app: App) {}

  /**
   * Crear una nueva entidad
   *
   * Interface simplificada que delega a los servicios WithVault.
   *
   * @param params Parámetros de creación
   * @returns Resultado de la acción
   *
   * @example
   * await handler.create({
   *   type: 'project',
   *   name: 'Mi Proyecto',
   *   priority: 'ALTA'
   * });
   */
  async create(params: CreateActionParams): Promise<ActionResult> {
    try {
      const { type, name, title, description, priority, dueDate } = params;

      // Normalizar nombre
      const entityName = name || title;
      if (!entityName || entityName.trim() === '') {
        return {
          success: false,
          message: 'El nombre de la entidad es requerido',
          error: 'MISSING_NAME',
        };
      }

      switch (type) {
        case 'project': {
          const result = await ProjectServiceWithVault.createProjectWithVault({
            projectName: entityName,
            description: description || 'Sin descripción',
            priority: (priority || 'MEDIA') as any,
          });
          return {
            success: result.success,
            message: result.error || `✅ Proyecto "${entityName}" creado`,
            data: result,
          };
        }

        case 'objective': {
          const result = await ObjectiveServiceWithVault.createObjectiveWithVault({
            objectiveName: entityName,
            description: description || 'Sin descripción',
            priority: (priority || 'MEDIA') as any,
          });
          return {
            success: result.success,
            message: result.error || `✅ Objetivo "${entityName}" creado`,
            data: result,
          };
        }

        case 'task': {
          const result = await TaskServiceWithVault.createTaskWithVault({
            taskName: entityName,
            description: description || 'Sin descripción',
            priority: (priority || 'MEDIA') as any,
            dueDate: dueDate || undefined,
          });
          return {
            success: result.success,
            message: result.error || `✅ Tarea "${entityName}" creada`,
            data: result,
          };
        }

        case 'document': {
          const result = await DocumentServiceWithVault.createDocumentWithVault({
            documentName: entityName,
            description: description || 'Sin descripción',
          });
          return {
            success: result.success,
            message: result.error || `✅ Documento "${entityName}" creado`,
            data: result,
          };
        }

        default:
          return {
            success: false,
            message: `Tipo de entidad no soportado: ${type}`,
            error: 'INVALID_TYPE',
          };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ Error al crear: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Editar una entidad existente
   *
   * LIMITACIÓN: Por ahora, solo soporta cambios simples de status/priority.
   * Implementaciones futuras pueden extender esto.
   *
   * @param params Parámetros de edición
   * @returns Resultado de la acción
   */
  async edit(params: EditActionParams): Promise<ActionResult> {
    try {
      const { uid, updates } = params;

      if (!uid || uid.trim() === '') {
        return {
          success: false,
          message: 'El UID de la entidad es requerido',
          error: 'MISSING_UID',
        };
      }

      // TODO: Implementación completa de edición
      // Requiere obtener entityType y folderPath del .index.json
      return {
        success: false,
        message: 'Edición de entidades aún no implementada vía botones',
        error: 'NOT_IMPLEMENTED',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ Error al editar: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Eliminar una entidad
   *
   * LIMITACIÓN: Por ahora, solo retorna un mensaje informativo.
   * La eliminación requiere más contexto que actualmente no está disponible.
   *
   * @param params Parámetros de eliminación
   * @returns Resultado de la acción
   */
  async delete(params: DeleteActionParams): Promise<ActionResult> {
    try {
      const { uid, permanent = false } = params;

      if (!uid || uid.trim() === '') {
        return {
          success: false,
          message: 'El UID de la entidad es requerido',
          error: 'MISSING_UID',
        };
      }

      // TODO: Implementación completa de eliminación
      return {
        success: false,
        message: 'Eliminación de entidades aún no implementada vía botones',
        error: 'NOT_IMPLEMENTED',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ Error al eliminar: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Completar una tarea
   *
   * LIMITACIÓN: Por ahora solo informativo.
   * Requiere contexto adicional para actualizar el archivo.
   *
   * @param params Parámetros de completación
   * @returns Resultado de la acción
   */
  async complete(params: CompleteActionParams): Promise<ActionResult> {
    try {
      const { uid } = params;

      if (!uid || uid.trim() === '') {
        return {
          success: false,
          message: 'El UID de la tarea es requerido',
          error: 'MISSING_UID',
        };
      }

      // TODO: Implementación completa de completación
      return {
        success: false,
        message: 'Completación de tareas aún no implementada vía botones',
        error: 'NOT_IMPLEMENTED',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ Error al completar: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Archivar una entidad
   *
   * LIMITACIÓN: Por ahora solo informativo.
   *
   * @param params Parámetros de archivo
   * @returns Resultado de la acción
   */
  async archive(params: ArchiveActionParams): Promise<ActionResult> {
    try {
      const { uid } = params;

      if (!uid || uid.trim() === '') {
        return {
          success: false,
          message: 'El UID de la entidad es requerido',
          error: 'MISSING_UID',
        };
      }

      // TODO: Implementación completa de archivación
      return {
        success: false,
        message: 'Archivación de entidades aún no implementada vía botones',
        error: 'NOT_IMPLEMENTED',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ Error al archivar: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }
}

/**
 * Crear instancia singleton del ActionHandler
 */
let actionHandlerInstance: ActionHandler | null = null;

/**
 * Inicializar ActionHandler
 */
export function initializeActionHandler(app: App): ActionHandler {
  actionHandlerInstance = new ActionHandler(app);
  return actionHandlerInstance;
}

/**
 * Obtener instancia del ActionHandler
 */
export function getActionHandler(): ActionHandler {
  if (!actionHandlerInstance) {
    throw new Error('ActionHandler no está inicializado. Llama a initializeActionHandler primero.');
  }
  return actionHandlerInstance;
}
