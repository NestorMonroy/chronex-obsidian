/**
 * UC-050: dependencyManager
 * 
 * Sistema para manejar dependencias entre tareas (bloqueos).
 * Incluye detección de ciclos, cálculo de critical path, etc.
 */

import type {
  Task,
  Dependency,
  DependencyResult,
  ResolutionResult,
  CycleDetectionResult,
  CriticalPathResult,
  ImpactResult,
  GraphResult
} from './types';

export class DependencyManager {
  /**
   * Parsear dependencia desde línea markdown
   */
  parseDependencyFromLine(line: string, taskId: string): DependencyResult {
    if (!line) {
      return { success: true, dependency: null };
    }

    // Buscar "🔗 ⬆️ ^task-id" (depende de)
    const dependsMatch = line.match(/🔗\s*⬆️\s*\^([\w-]+)/);
    if (dependsMatch) {
      const dependsOnId = dependsMatch[1];
      return {
        success: true,
        dependency: {
          taskId,
          dependsOn: dependsOnId,
          type: 'depends'
        }
      };
    }

    // Buscar "🔗 ⬇️ ^task-id" (bloquea)
    const blocksMatch = line.match(/🔗\s*⬇️\s*\^([\w-]+)/);
    if (blocksMatch) {
      const blocksId = blocksMatch[1];
      return {
        success: true,
        dependency: {
          taskId,
          dependsOn: blocksId,
          type: 'blocks'
        }
      };
    }

    return { success: true, dependency: null };
  }

  /**
   * Parsear múltiples dependencias
   */
  parseDependenciesFromLine(line: string, taskId: string): Dependency[] {
    const dependencies: Dependency[] = [];

    // Buscar "⬆️ ^task-id" (depende de)
    const dependsMatches = line.matchAll(/⬆️\s*\^([\w-]+)/g);
    for (const match of dependsMatches) {
      dependencies.push({
        taskId,
        dependsOn: match[1],
        type: 'depends'
      });
    }

    // Buscar "⬇️ ^task-id" (bloquea)
    const blocksMatches = line.matchAll(/⬇️\s*\^([\w-]+)/g);
    for (const match of blocksMatches) {
      dependencies.push({
        taskId,
        dependsOn: match[1],
        type: 'blocks'
      });
    }

    return dependencies;
  }

  /**
   * Agregar dependencia a una tarea
   */
  addDependency(
    task: Task | null,
    dependsOnId: string,
    type: 'depends' | 'blocks'
  ): { success: boolean; task?: Task; error?: string } {
    if (!task) {
      return { success: false, error: 'Task is null' };
    }

    // Validar auto-referencia
    if (task.id === dependsOnId) {
      return { success: false, error: 'Task cannot depend on itself' };
    }

    const updated = { ...task };

    if (type === 'depends') {
      updated.dependencies = updated.dependencies || [];
      if (!updated.dependencies.includes(dependsOnId)) {
        updated.dependencies.push(dependsOnId);
      }
    } else {
      updated.blocking = updated.blocking || [];
      if (!updated.blocking.includes(dependsOnId)) {
        updated.blocking.push(dependsOnId);
      }
    }

    return { success: true, task: updated };
  }

  /**
   * Remover dependencia
   */
  removeDependency(
    task: Task | null,
    dependsOnId: string
  ): { success: boolean; task?: Task; error?: string } {
    if (!task) {
      return { success: false, error: 'Task is null' };
    }

    const updated = { ...task };

    if (updated.dependencies) {
      updated.dependencies = updated.dependencies.filter(d => d !== dependsOnId);
    }
    if (updated.blocking) {
      updated.blocking = updated.blocking.filter(b => b !== dependsOnId);
    }

    return { success: true, task: updated };
  }

  /**
   * Detectar ciclos en dependencias
   */
  detectCycles(tasks: Task[]): CycleDetectionResult {
    const cycles: Array<{ from: string; to: string }> = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies) {
        recursionStack.delete(taskId);
        return false;
      }

      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycleDFS(depId)) {
            cycles.push({ from: taskId, to: depId });
            return true;
          }
        } else if (recursionStack.has(depId)) {
          cycles.push({ from: taskId, to: depId });
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        hasCycleDFS(task.id);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles: cycles.length > 0 ? cycles : undefined
    };
  }

  /**
   * Resolver si tarea puede ejecutarse
   */
  resolveDependencies(
    task: Task | null,
    allTasks: Task[]
  ): ResolutionResult {
    if (!task) {
      return { success: false, canExecute: false, error: 'Task is null' };
    }

    const blockedBy: string[] = [];
    const blocking: string[] = [];

    // Verificar dependencias
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = allTasks.find(t => t.id === depId);
        if (!depTask) {
          return {
            success: false,
            canExecute: false,
            error: `Dependency task ${depId} not found`
          };
        }

        // Si la dependencia NO está DONE, bloquea esta tarea
        if (depTask.status !== 'DONE') {
          blockedBy.push(depId);
        }
      }
    }

    // Verificar tareas que dependen de esta
    if (task.blocking && task.blocking.length > 0) {
      blocking.push(...task.blocking);
    }

    return {
      success: true,
      canExecute: blockedBy.length === 0,
      blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
      blocking: blocking.length > 0 ? blocking : undefined
    };
  }

  /**
   * Calcular critical path
   */
  calculateCriticalPath(tasks: Task[]): CriticalPathResult {
    // Topological sort + path calculation
    const inDegree: { [key: string]: number } = {};
    const adjList: { [key: string]: string[] } = {};

    // Inicializar
    for (const task of tasks) {
      inDegree[task.id] = 0;
      adjList[task.id] = [];
    }

    // Construir grafo
    for (const task of tasks) {
      if (task.dependencies) {
        for (const dep of task.dependencies) {
          adjList[dep] = adjList[dep] || [];
          adjList[dep].push(task.id);
          inDegree[task.id]++;
        }
      }
    }

    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    for (const [taskId, degree] of Object.entries(inDegree)) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    const topologicalOrder: string[] = [];
    const tempInDegree = { ...inDegree };

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      topologicalOrder.push(taskId);

      for (const neighbor of adjList[taskId] || []) {
        tempInDegree[neighbor]--;
        if (tempInDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Verificar ciclo
    if (topologicalOrder.length !== tasks.length) {
      return { success: false, error: 'Cycle detected in dependencies' };
    }

    // Calcular critical tasks (aquellas que impactan el camino más largo)
    const criticalTasks = new Set<string>();
    const visited = new Set<string>();

    const findCritical = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      criticalTasks.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task && task.dependencies) {
        for (const dep of task.dependencies) {
          findCritical(dep);
        }
      }
    };

    // Tareas sin dependencias son críticas
    for (const task of tasks) {
      if (!task.dependencies || task.dependencies.length === 0) {
        findCritical(task.id);
      }
    }

    return {
      success: true,
      criticalPath: topologicalOrder,
      criticalTasks: Array.from(criticalTasks)
    };
  }

  /**
   * Calcular impacto de cambiar estado
   */
  calculateImpact(
    tasks: Task[],
    taskId: string,
    newStatus: string
  ): ImpactResult {
    const affected: string[] = [];
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Si la tarea se completa, puede desbloquear otras
    if (newStatus === 'DONE' && task.blocking && task.blocking.length > 0) {
      affected.push(...task.blocking);
    }

    // Si la tarea ya no está completa, tareas bloqueadas se bloquean
    if (newStatus !== 'DONE' && task.blocking && task.blocking.length > 0) {
      affected.push(...task.blocking);
    }

    return {
      success: true,
      affected: affected.length > 0 ? affected : undefined
    };
  }

  /**
   * Generar grafo de dependencias
   */
  generateDependencyGraph(tasks: Task[]): GraphResult {
    const nodes = tasks.map(task => ({
      id: task.id,
      label: task.description
    }));

    const edges: Array<{ from: string; to: string }> = [];

    for (const task of tasks) {
      if (task.dependencies) {
        for (const dep of task.dependencies) {
          edges.push({ from: dep, to: task.id });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Visualizar dependencias en texto
   */
  visualizeDependencies(tasks: Task[]): string {
    let output = '# Dependency Graph\n\n';

    for (const task of tasks) {
      output += `${task.id}: ${task.description}\n`;

      if (task.dependencies && task.dependencies.length > 0) {
        output += `  ⬆️ depends on: ${task.dependencies.join(', ')}\n`;
      }

      if (task.blocking && task.blocking.length > 0) {
        output += `  ⬇️ blocks: ${task.blocking.join(', ')}\n`;
      }
    }

    return output;
  }
}

export default DependencyManager;
