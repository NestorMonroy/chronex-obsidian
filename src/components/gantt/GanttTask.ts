/**
 * GanttTask - Wrapper de tarea para Gantt
 * SEMANA 3: Encapsulación de datos
 */

import { CachedTask } from '../../services/dataManager/types';
import { GanttChartData } from './GanttRenderer';

export class GanttTask {
  private cachedTask: CachedTask;
  private chartData: GanttChartData;
  private element?: HTMLElement;

  constructor(cachedTask: CachedTask, chartData: GanttChartData) {
    this.cachedTask = cachedTask;
    this.chartData = chartData;
  }

  /**
   * Obtener tarea cacheada
   */
  getCachedTask(): CachedTask {
    return this.cachedTask;
  }

  /**
   * Obtener datos para chart
   */
  getChartData(): GanttChartData {
    return this.chartData;
  }

  /**
   * Actualizar datos del chart
   */
  updateChartData(updates: Partial<GanttChartData>): void {
    this.chartData = { ...this.chartData, ...updates };
  }

  /**
   * Obtener elemento DOM
   */
  getElement(): HTMLElement | undefined {
    return this.element;
  }

  /**
   * Establecer elemento DOM
   */
  setElement(element: HTMLElement): void {
    this.element = element;
  }

  /**
   * Obtener ID de tarea
   */
  getId(): string {
    return this.cachedTask.taskId;
  }

  /**
   * Obtener nombre/título
   */
  getTitle(): string {
    return this.cachedTask.frontmatter?.title || 'Sin título';
  }

  /**
   * Obtener descripción
   */
  getDescription(): string {
    return this.cachedTask.frontmatter?.description || '';
  }

  /**
   * Obtener prioridad
   */
  getPriority(): string {
    return this.cachedTask.frontmatter?.priority || 'MEDIA';
  }

  /**
   * Obtener estado
   */
  getStatus(): string {
    return this.cachedTask.frontmatter?.status || 'pendiente';
  }

  /**
   * Obtener fecha de vencimiento
   */
  getDueDate(): string {
    return this.cachedTask.frontmatter?.dueDate || '';
  }

  /**
   * Obtener fecha de creación
   */
  getCreatedDate(): string {
    return this.cachedTask.frontmatter?.dateCreated || '';
  }

  /**
   * Obtener progreso
   */
  getProgress(): number {
    return this.chartData.progress || 0;
  }

  /**
   * Obtener ruta del archivo
   */
  getFilePath(): string {
    return this.cachedTask.notePath || '';
  }

  /**
   * Obtener ruta de la carpeta
   */
  getFolderPath(): string {
    return this.cachedTask.folderPath || '';
  }

  /**
   * Obtener dependencias
   */
  getDependencies(): string[] {
    return this.chartData.dependencies || [];
  }

  /**
   * Verificar si está completada
   */
  isCompleted(): boolean {
    return this.getStatus() === 'done' || this.getProgress() === 100;
  }

  /**
   * Verificar si está bloqueada
   */
  isBlocked(): boolean {
    return this.getStatus() === 'blocked';
  }

  /**
   * Obtener información resumida
   */
  getSummary(): {
    id: string;
    title: string;
    priority: string;
    status: string;
    progress: number;
    dueDate: string;
  } {
    return {
      id: this.getId(),
      title: this.getTitle(),
      priority: this.getPriority(),
      status: this.getStatus(),
      progress: this.getProgress(),
      dueDate: this.getDueDate(),
    };
  }

  /**
   * Obtener información detallada
   */
  getDetails(): {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    progress: number;
    dueDate: string;
    createdDate: string;
    filePath: string;
    dependencies: string[];
    isCompleted: boolean;
    isBlocked: boolean;
  } {
    return {
      id: this.getId(),
      title: this.getTitle(),
      description: this.getDescription(),
      priority: this.getPriority(),
      status: this.getStatus(),
      progress: this.getProgress(),
      dueDate: this.getDueDate(),
      createdDate: this.getCreatedDate(),
      filePath: this.getFilePath(),
      dependencies: this.getDependencies(),
      isCompleted: this.isCompleted(),
      isBlocked: this.isBlocked(),
    };
  }
}
