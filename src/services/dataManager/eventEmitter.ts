/**
 * EventEmitter para DataManager
 * Patrón observer para cambios de tareas
 */

import { TaskChangeEvent } from './types';

type EventListener = (event: TaskChangeEvent) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Suscribirse a evento
   * @param eventType - 'create', 'update', 'delete' o '*' para todos
   * @param listener - Función a ejecutar
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Retornar función para desuscribirse
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Suscribirse solo una vez
   */
  once(eventType: string, listener: EventListener): () => void {
    const wrappedListener = (event: TaskChangeEvent) => {
      listener(event);
      unsubscribe();
    };

    const unsubscribe = this.on(eventType, wrappedListener);
    return unsubscribe;
  }

  /**
   * Emitir evento
   */
  emit(event: TaskChangeEvent): void {
    // Emitir a listeners específicos
    const specificListeners = this.listeners.get(event.type) || new Set();
    specificListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[EventEmitter] Error in listener:', error);
      }
    });

    // Emitir a listeners globales (*)
    const globalListeners = this.listeners.get('*') || new Set();
    globalListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[EventEmitter] Error in global listener:', error);
      }
    });
  }

  /**
   * Desuscribir todos los listeners de un evento
   */
  off(eventType: string, listener?: EventListener): void {
    if (!listener) {
      this.listeners.delete(eventType);
      return;
    }

    this.listeners.get(eventType)?.delete(listener);
  }

  /**
   * Contar listeners activos
   */
  listenerCount(eventType?: string): number {
    if (!eventType) {
      return Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0);
    }

    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Limpiar todos los listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}
