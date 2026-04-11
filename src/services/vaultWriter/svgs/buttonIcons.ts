/**
 * UC-056: BUTTON ICONS LIBRARY
 * 
 * Librería de SVGs profesionales para botones integrados
 * Colores temáticos y escalables
 */

export const ButtonIcons = {
  /**
   * COMPLETE - Checkmark (Verde)
   * Para marcar tareas como completadas
   */
  complete: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50"/>
  </svg>`,

  /**
   * EDIT - Pencil (Azul)
   * Para editar tareas
   */
  edit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#2196F3"/>
    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#2196F3"/>
  </svg>`,

  /**
   * DELETE - Trash (Rojo)
   * Para eliminar tareas
   */
  delete: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" fill="#F44336"/>
  </svg>`,

  /**
   * PRIORITY - Pin (Naranja)
   * Para cambiar prioridad
   */
  priority: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#FF9800"/>
  </svg>`,

  /**
   * DUE DATE - Calendar (Púrpura)
   * Para establecer fecha de vencimiento
   */
  dueDate: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v5h7v-5z" fill="#9C27B0"/>
  </svg>`,

  /**
   * OPEN LINK - External Link (Cian)
   * Para abrir enlaces/referencias
   */
  openLink: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7z" fill="#00BCD4"/>
    <path d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z" fill="#00BCD4"/>
  </svg>`,

  /**
   * HOME - House (Verde)
   * Para ir al home/dashboard
   */
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" fill="#4CAF50"/>
  </svg>`,

  /**
   * REFRESH - Refresh/Sync (Azul)
   * Para refrescar o sincronizar
   */
  refresh: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c4.42 0 8-3.58 8-8-.01-2.05-.87-4.05-2.35-5.65zm2.92-.82l3.15 3.15h-3.99v-3.99l3.84 3.84zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#2196F3"/>
  </svg>`,

  /**
   * ARCHIVE - Archive (Gris)
   * Para archivar tareas
   */
  archive: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 19.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm6-11.5H6v-1h12v1z" fill="#9E9E9E"/>
  </svg>`,

  /**
   * STATS - Statistics (Verde oscuro)
   * Para ver estadísticas
   */
  stats: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#2E7D32"/>
  </svg>`,

  /**
   * ADD - Plus (Azul claro)
   * Para crear nuevas cosas
   */
  add: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#1976D2"/>
  </svg>`,

  /**
   * TAG - Label (Violeta)
   * Para agregar tags
   */
  tag: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" fill="#7B1FA2"/>
  </svg>`,

  /**
   * NOTE - Document/Note (Gris azulado)
   * Para agregar notas
   */
  note: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#546E7A"/>
  </svg>`
};

/**
 * UTILIDAD: Obtener SVG por nombre de acción
 */
export function getSvgIcon(action: string): string {
  return ButtonIcons[action as keyof typeof ButtonIcons] || '';
}

/**
 * UTILIDAD: Crear botón HTML con SVG
 */
export function createButtonWithSvg(
  action: string,
  label: string,
  url: string
): string {
  const icon = getSvgIcon(action);
  if (!icon) {
    return `[${label}](${url})`;
  }
  return `[${icon} ${label}](${url})`;
}

export default ButtonIcons;
