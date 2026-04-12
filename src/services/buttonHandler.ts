/**
 * ButtonHandler - Sistema de botones interactivos con button:// URIs
 *
 * Sistema principal para interacción con el plugin desde notas Markdown.
 * Los botones usan URIs en formato button:// que son procesados por este handler.
 *
 * ARQUITECTURA:
 * - Los botones son el PRIMARY way de interactuar con el plugin
 * - Cada botón dispara una acción através del ActionHandler
 * - No depende de scripts externos en el vault
 * - Completamente auto-contenido en el plugin
 *
 * Ejemplos de button:// URIs:
 * - button://create?type=task&name=Mi%20Tarea&priority=ALTA
 * - button://create?type=project&name=Mi%20Proyecto
 * - button://edit?uid=PROJ-202604-ABC
 * - button://complete?uid=TSK-202604-XYZ
 * - button://archive?uid=OBJ-202604-ABC
 * - button://delete?uid=DOC-202604-XYZ
 *
 * @see ActionHandler para implementación de acciones
 */

import { App, Notice, MarkdownPostProcessorContext } from 'obsidian';
import { ActionHandler, getActionHandler } from './actionHandler';

export interface ButtonAction {
  action: string;
  params: Record<string, string>;
}

/**
 * Parse button:// URI format
 *
 * Soporta todos los parámetros que necesita ActionHandler.
 * Los parámetros se envían directamente como query params.
 *
 * @param uri button:// URI a parsear
 * @returns Objeto con action y params parseados
 *
 * @example
 * // Input: button://create?type=task&name=Mi%20Tarea&priority=ALTA
 * // Output: {
 * //   action: 'create',
 * //   params: {
 * //     type: 'task',
 * //     name: 'Mi Tarea',
 * //     priority: 'ALTA'
 * //   }
 * // }
 */
function parseButtonUri(uri: string): ButtonAction | null {
  try {
    const match = uri.match(/^button:\/\/([^?]+)(?:\?(.*))?$/);
    if (!match) return null;

    const action = match[1];
    const queryString = match[2] || '';
    const params: Record<string, string> = {};

    // Parse query parameters
    if (queryString) {
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }

    return { action, params };
  } catch (error) {
    console.error('[ButtonHandler] Error parsing URI:', error);
    return null;
  }
}

/**
 * Handle button clicks - dispatcher a ActionHandler
 *
 * Esta es la función principal que procesa las acciones de botones.
 * Delega cada acción al ActionHandler correspondiente y maneja notificaciones.
 */
async function handleButtonClick(action: ButtonAction): Promise<void> {
  const { action: actionType, params } = action;
  const handler = getActionHandler();

  console.log(`[ButtonHandler] Acción: ${actionType}`, params);

  try {
    let result;

    switch (actionType) {
      case 'create':
        result = await handler.create(params as any);
        break;

      case 'edit':
        result = await handler.edit({
          uid: params.uid,
          updates: params,
        });
        break;

      case 'complete':
        result = await handler.complete({ uid: params.uid });
        break;

      case 'delete':
        result = await handler.delete({
          uid: params.uid,
          permanent: params.permanent === 'true',
        });
        break;

      case 'archive':
        result = await handler.archive({ uid: params.uid });
        break;

      // Acciones compuestas (editar con cambio de status/priority)
      case 'status':
        result = await handler.edit({
          uid: params.uid,
          updates: { status: params.value },
        });
        break;

      case 'priority':
        result = await handler.edit({
          uid: params.uid,
          updates: { priority: params.value },
        });
        break;

      default:
        new Notice(`⚠️ Acción desconocida: ${actionType}`);
        return;
    }

    // Mostrar resultado
    if (result.success) {
      new Notice(`✅ ${result.message}`);
    } else {
      new Notice(`❌ ${result.message}`, 5000);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ButtonHandler] Error:', errorMsg);
    new Notice(`❌ Error: ${errorMsg}`, 5000);
  }
}

/**
 * Registrar button handler con el markdown processor de Obsidian
 *
 * Busca todos los links con href que empiezan con button:// y los convierte
 * en botones interactivos que disparan acciones del plugin.
 *
 * Los botones se estilifan automáticamente con la clase CSS 'chronex-button-link'
 * para que se vean como botones en lugar de links.
 *
 * @param app Instancia de la app Obsidian
 *
 * @example
 * En una nota markdown:
 * [Crear Tarea](button://create?type=task&name=Nueva%20Tarea&priority=ALTA)
 *
 * Al hacer click:
 * 1. Se previene el comportamiento por defecto del link
 * 2. Se parsea el button:// URI
 * 3. Se ejecuta la acción través de ActionHandler
 * 4. Se muestra una notificación con el resultado
 */
export function registerButtonHandler(app: App): void {
  console.log('[ButtonHandler] Registrando button handler...');

  // Registrar markdown post processor para procesar button:// links
  (app as any).registerMarkdownPostProcessor?.(
    (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const links = el.querySelectorAll('a[href^="button://"]') as NodeListOf<HTMLAnchorElement>;

      Array.from(links).forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('button://')) return;

        // Prevenir comportamiento por defecto del link
        link.addEventListener('click', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          // Parsear y ejecutar acción del botón
          const parsed = parseButtonUri(href);
          if (!parsed) {
            new Notice('❌ Formato de botón inválido');
            console.error('[ButtonHandler] Invalid button URI:', href);
            return;
          }

          // Ejecutar acción
          handleButtonClick(parsed).catch((error) => {
            console.error('[ButtonHandler] Error handling button click:', error);
            new Notice('❌ Error ejecutando acción');
          });
        });

        // Estilar como botón
        link.classList.add('chronex-button-link');
        link.style.cursor = 'pointer';
        link.style.padding = '4px 8px';
        link.style.borderRadius = '4px';
        link.style.display = 'inline-block';
        link.style.textDecoration = 'none';
      });
    }
  );

  console.log('[ButtonHandler] Button handler registrado exitosamente ✅');
}

export const ButtonHandler = {
  parseButtonUri,
  registerButtonHandler,
};
