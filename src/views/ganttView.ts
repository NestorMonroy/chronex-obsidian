/**
 * GanttView - Vista de Obsidian para Gantt Chart
 * SEMANA 3: Integración completa con Obsidian
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { GanttRenderer } from '../components/gantt/ganttRenderer';
import { DataManager, dataManager } from '../services/dataManager/dataManager';
import type { TaskChangeEvent } from '../services/dataManager/types';

export const GANTT_VIEW_TYPE = 'chronex-obsidian-gantt';

export class GanttView extends ItemView {
  private ganttRenderer?: GanttRenderer;
  private currentProjectId?: string;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return GANTT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Gantt Chart';
  }

  getIcon(): string {
    return 'gantt-chart';
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    // Crear header
    const header = contentEl.createEl('div', { cls: 'gantt-view-header' });
    header.style.padding = '10px';
    header.style.borderBottom = '1px solid var(--background-modifier-border)';

    header.createEl('h2', { text: 'Gantt Chart', cls: 'gantt-view-title' });

    // Botones de control
    const controlsDiv = header.createEl('div', { cls: 'gantt-controls' });
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '10px';
    controlsDiv.style.marginTop = '10px';

    const reloadBtn = controlsDiv.createEl('button', { text: 'Recargar' });
    reloadBtn.addEventListener('click', () => this.refreshGantt());

    const statsBtn = controlsDiv.createEl('button', { text: 'Estadísticas' });
    statsBtn.addEventListener('click', () => this.showStats());

    // Crear contenedor Gantt
    const ganttContainer = contentEl.createEl('div', { cls: 'gantt-view-container' });
    ganttContainer.style.height = 'calc(100% - 100px)';
    ganttContainer.style.overflowY = 'auto';

    // Crear renderer
    this.ganttRenderer = new GanttRenderer({
      container: ganttContainer,
      taskHeight: 35,
      barHeight: 20,
      onDateChange: (taskId: string, startDate: string, endDate: string) => {
        this.handleDateChange(taskId, startDate, endDate);
      },
      onTaskClick: (taskId: string) => {
        this.handleTaskClick(taskId);
      },
    });

    // Renderizar
    await this.refreshGantt();

    // Suscribirse a cambios
    dataManager.onChange((event: TaskChangeEvent) => {
      if (event.type === 'update' || event.type === 'create' || event.type === 'delete') {
        this.refreshGantt().catch((error: Error) => {
          console.error('[GanttView] Auto-refresh error:', error);
        });
      }
    });
  }

  async onClose(): Promise<void> {
    if (this.ganttRenderer) {
      this.ganttRenderer.destroy();
    }
  }

  /**
   * Refrescar Gantt
   */
  private async refreshGantt(): Promise<void> {
    if (!this.ganttRenderer) return;

    try {
      await this.ganttRenderer.render(this.currentProjectId);

      // Actualizar estadísticas en UI
      const stats = this.ganttRenderer.getStats();
      console.log('[GanttView] Rendered:', stats);
    } catch (error) {
      console.error('[GanttView] Refresh error:', error);
    }
  }

  /**
   * Manejar cambio de fecha
   */
  private async handleDateChange(
    taskId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      const dateStr = startDate.toISOString().split('T')[0];

      await dataManager.updateTask(taskId, {
        dueDate: dateStr,
      });

      console.log('[GanttView] Updated task date:', taskId, dateStr);
    } catch (error) {
      console.error('[GanttView] Date change error:', error);
    }
  }

  /**
   * Manejar click en tarea
   */
  private handleTaskClick(taskId: string): void {
    console.log('[GanttView] Task clicked:', taskId);

    // Aquí se podría abrir el archivo de la tarea
    // o mostrar un modal con detalles
    const task = this.ganttRenderer?.getTasks().find((t: any) => t.getId() === taskId);
    if (task) {
      const filePath = task.getFilePath();
      // TODO: Abrir archivo en Obsidian
      console.log('[GanttView] Open file:', filePath);
    }
  }

  /**
   * Mostrar estadísticas
   */
  private showStats(): void {
    if (!this.ganttRenderer) return;

    const stats = this.ganttRenderer.getStats();

    const statsText = `
      Total de tareas: ${stats.totalTasks}
      Tareas completadas: ${stats.completedTasks}
      Progreso promedio: ${stats.averageProgress}%
    `;

    console.log('[GanttView] Stats:', statsText);

    // Mostrar en modal o notice
    // TODO: Mostrar UI de estadísticas
  }

  /**
   * Establecer proyecto actual
   */
  setProjectId(projectId: string): void {
    this.currentProjectId = projectId;
    this.refreshGantt().catch((error) => {
      console.error('[GanttView] Project change error:', error);
    });
  }
}
