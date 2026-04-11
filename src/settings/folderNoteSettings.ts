/**
 * FolderNoteSettings - Configuración profesional tipo Folder Note
 * 
 * Lógica de Folder Note implementada en obsidian-repo:
 * - folderNoteName: Nombre del archivo (variable, no hardcodeado)
 * - folderNoteHide: Ocultar del árbol de archivos
 * - folderNoteAutoRename: Auto-actualizar metadatos
 * - folderDelete2Note: Auto-eliminar cuando carpeta se borra
 */

export interface FolderNoteSettings {
  // Folder Note Configuration
  folderNoteName: string;           // "_index_", "_meta_", "_info_", "_readme_", etc
  folderNoteHide: boolean;          // Ocultar archivo del árbol
  folderNoteAutoRename: boolean;    // Auto-renombrar cuando metadatos cambian
  folderDelete2Note: boolean;       // Eliminar nota cuando carpeta se borra
  folderNoteType: 'inside' | 'outside';
  folderNoteKey: string;            // Hotkey (ej: 'ctrl' para Ctrl+click)
  
  // Visual Configuration
  useCardView: boolean;             // Usar card views en folder notes
  cardViewType: 'cute' | 'strip';   // Tipo de card view
  folderNoteHideInSidebar: boolean; // CSS para esconder en sidebar
}

export const DEFAULT_FOLDER_NOTE_SETTINGS: FolderNoteSettings = {
  // Folder Note (inspirado en Folder Note plugin)
  folderNoteName: '_index_',        // Nombre del archivo (CONFIGURABLE)
  folderNoteHide: true,             // Ocultar del árbol
  folderNoteAutoRename: true,       // Auto-actualizar cuando título cambia
  folderDelete2Note: true,          // Eliminar nota cuando carpeta se borra
  folderNoteType: 'inside',         // Dentro de la carpeta
  folderNoteKey: 'ctrl',            // Hotkey para toggle
  
  // Visual
  useCardView: true,
  cardViewType: 'cute',
  folderNoteHideInSidebar: true
};

/**
 * GUÍA DE CONFIGURACIÓN:
 * 
 * folderNoteName: "_index_" (recomendado)
 *   - ALTERNATIVAS: "_meta_", "_info_", "_readme_", "_main_", etc
 *   - NO usar: README.md, index.md (conflictan con estándares)
 *   - BENEFICIO: Flexible, no hardcodeado
 * 
 * folderNoteHide: true (recomendado)
 *   - Mantiene árbol de archivos limpio
 *   - Los archivos de "metadata" se ocultan
 * 
 * folderNoteAutoRename: true (recomendado)
 *   - Cuando editas título del proyecto, el index se actualiza
 *   - Cuando cambias estado, el index se actualiza
 *   - CERO trabajo manual
 * 
 * folderDelete2Note: true (recomendado)
 *   - Sincronización: borrar proyecto → borrar index automático
 *   - Evita archivos huérfanos
 */
