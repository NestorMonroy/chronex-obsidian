/**
 * Tests para UC-INT03: Cross-plugin Flow (Flujo entre Plugins)
 * 
 * Test-Driven Development: Escribir tests PRIMERO
 * 
 * Este UC orquesta el flujo completo de crear una entidad:
 * 1. Usuario ejecuta macro (QuickAdd)
 * 2. Validación de datos (Validator)
 * 3. Generación de ID único (IdGenerator)
 * 4. Creación de estructura (PluginInstaller)
 * 5. Generación de nota (Templater)
 * 6. Notificación al usuario (NotificationHelper)
 * 
 * @see /docs/specification/use-cases/uc-int03-cross-plugin-flow.md
 */

import { CrossPluginFlow, FlowInput, FlowResult } from '../../src/services/crossPluginFlow';

describe('UC-INT03: Cross-plugin Flow', () => {
  
  describe('executeCreateProjectFlow', () => {
    it('debe ejecutar flujo completo de creación de proyecto', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Mi Proyecto',
          description: 'Descripción del proyecto',
          startDate: '2026-04-11'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.entityId).toBeDefined();
      expect(result.folderCreated).toBeDefined();
      expect(result.noteCreated).toBeDefined();
    });

    it('debe validar datos antes de procesar', async () => {
      // ARRANGE
      const invalidInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: '', // vacío
          description: 'Descripción'
        }
      };

      // ACT & ASSERT
      await expect(CrossPluginFlow.executeCreateProjectFlow(invalidInput)).rejects.toThrow();
    });

    it('debe generar ID único para proyecto', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Proyecto con ID',
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.entityId).toMatch(/^PROJ-\d{6}-[A-Z0-9]{5}$/);
    });

    it('debe crear carpeta de proyecto', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Proyecto Carpeta',
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.folderCreated).toBe(true);
      expect(result.folderPath).toBeDefined();
    });

    it('debe crear nota desde template', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Proyecto Nota',
          description: 'Test',
          priority: 'ALTA'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.noteCreated).toBe(true);
      expect(result.notePath).toBeDefined();
    });

    it('debe retornar información completa del flujo', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Proyecto Completo',
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('entityId');
      expect(result).toHaveProperty('steps');
      expect(result.steps).toContain('VALIDATED');
      expect(result.steps).toContain('ID_GENERATED');
      expect(result.steps).toContain('FOLDER_CREATED');
      expect(result.steps).toContain('NOTE_CREATED');
      expect(result.steps).toContain('NOTIFIED');
    });
  });

  describe('executeCreateObjectiveFlow', () => {
    it('debe crear objetivo en proyecto existente', async () => {
      // ARRANGE - Primero crear proyecto
      const projectInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Test Project',
          description: 'Test'
        }
      };

      const projectResult = await CrossPluginFlow.executeCreateProjectFlow(projectInput);
      const projectId = projectResult.entityId!;

      const input: FlowInput = {
        entityType: 'objective',
        data: {
          objectiveName: 'Mi Objetivo',
          projectId: projectId,
          description: 'Descripción',
          dueDate: '2026-06-15'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateObjectiveFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.entityId).toBeDefined();
      expect(result.entityId).toMatch(/^OBJ-/);
    });

    it('debe validar que proyecto existe', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'objective',
        data: {
          objectiveName: 'Objetivo',
          projectId: 'INVALID', // proyecto no existe
          description: 'Test'
        }
      };

      // ACT & ASSERT
      await expect(CrossPluginFlow.executeCreateObjectiveFlow(input)).rejects.toThrow();
    });
  });

  describe('executeCreateTaskFlow', () => {
    it('debe crear tarea en objetivo', async () => {
      // ARRANGE - Crear proyecto primero
      const projectInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Task Test Project',
          description: 'Test'
        }
      };

      const projectResult = await CrossPluginFlow.executeCreateProjectFlow(projectInput);
      const projectId = projectResult.entityId!;

      // Crear objetivo
      const objectiveInput: FlowInput = {
        entityType: 'objective',
        data: {
          objectiveName: 'Task Test Objective',
          projectId: projectId,
          description: 'Test'
        }
      };

      const objectiveResult = await CrossPluginFlow.executeCreateObjectiveFlow(objectiveInput);
      const objectiveId = objectiveResult.entityId!;

      // Crear tarea
      const input: FlowInput = {
        entityType: 'task',
        data: {
          taskName: 'Mi Tarea',
          objectiveId: objectiveId,
          priority: 'ALTA',
          dueDate: '2026-04-20'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateTaskFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.entityId).toMatch(/^TSK-/);
    });
  });

  describe('validateFlowInput', () => {
    it('debe validar entrada correcta', async () => {
      // ARRANGE
      const validInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Test Project',
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.validateFlowInput(validInput);

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar entrada sin entityType', async () => {
      // ARRANGE
      const invalidInput: any = {
        data: { projectName: 'Test' }
      };

      // ACT
      const result = await CrossPluginFlow.validateFlowInput(invalidInput);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe validar datos según entityType', async () => {
      // ARRANGE
      const projectInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Project', // requerido para project
          description: 'Desc'
        }
      };

      // ACT
      const result = await CrossPluginFlow.validateFlowInput(projectInput);

      // ASSERT
      expect(result.valid).toBe(true);
    });

    it('debe retornar lista de errores específicos', async () => {
      // ARRANGE
      const invalidInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: '', // vacío
          // falta description
        }
      };

      // ACT
      const result = await CrossPluginFlow.validateFlowInput(invalidInput);

      // ASSERT
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('orchestrateFlow', () => {
    it('debe orquestar flujo completo', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Orchestrated Project',
          description: 'Test orchestration'
        }
      };

      // ACT
      const result = await CrossPluginFlow.orchestrateFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('debe ejecutar pasos en orden correcto', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Ordered Steps',
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.orchestrateFlow(input);

      // ASSERT
      const steps = result.steps;
      expect(steps.indexOf('VALIDATED')).toBeLessThan(steps.indexOf('ID_GENERATED'));
      expect(steps.indexOf('ID_GENERATED')).toBeLessThan(steps.indexOf('FOLDER_CREATED'));
      expect(steps.indexOf('FOLDER_CREATED')).toBeLessThan(steps.indexOf('NOTE_CREATED'));
    });

    it('debe capturar errores en cualquier paso', async () => {
      // ARRANGE
      const invalidInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: '', // inválido
          description: 'Test'
        }
      };

      // ACT & ASSERT
      await expect(CrossPluginFlow.orchestrateFlow(invalidInput)).rejects.toThrow();
    });
  });

  describe('Integration: Full Project Creation Flow', () => {
    it('debe completar flujo de creación de proyecto end-to-end', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'E2E Project',
          description: 'End-to-end test',
          priority: 'MEDIA'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.entityId).toBeDefined();
      expect(result.folderCreated).toBe(true);
      expect(result.noteCreated).toBe(true);
      expect(result.notified).toBe(true);
    });

    it('debe permitir cascada: proyecto → objetivo → tarea', async () => {
      // ARRANGE
      const projectInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'Cascade Project',
          description: 'Test cascade'
        }
      };

      // ACT
      const projectResult = await CrossPluginFlow.executeCreateProjectFlow(projectInput);
      
      const objectiveInput: FlowInput = {
        entityType: 'objective',
        data: {
          objectiveName: 'Cascade Objective',
          projectId: projectResult.entityId,
          description: 'Test'
        }
      };

      const objectiveResult = await CrossPluginFlow.executeCreateObjectiveFlow(objectiveInput);

      const taskInput: FlowInput = {
        entityType: 'task',
        data: {
          taskName: 'Cascade Task',
          objectiveId: objectiveResult.entityId,
          priority: 'ALTA'
        }
      };

      const taskResult = await CrossPluginFlow.executeCreateTaskFlow(taskInput);

      // ASSERT
      expect(projectResult.success).toBe(true);
      expect(objectiveResult.success).toBe(true);
      expect(taskResult.success).toBe(true);
    });
  });

  describe('Error Handling & Recovery', () => {
    it('debe proporcionar mensajes de error del paso fallido', async () => {
      // ARRANGE
      const invalidInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: '', // será rechazado por validación
          description: 'Test'
        }
      };

      // ACT & ASSERT
      try {
        await CrossPluginFlow.executeCreateProjectFlow(invalidInput);
      } catch (error: any) {
        expect(error.message).toContain('Validación' || 'projectName' || 'inválido');
      }
    });

    it('debe mantener estado consistente si un paso falla', async () => {
      // ARRANGE
      const invalidInput: FlowInput = {
        entityType: 'project',
        data: {
          projectName: '', // fallará en validación
          description: 'Test'
        }
      };

      // ACT & ASSERT
      await expect(CrossPluginFlow.executeCreateProjectFlow(invalidInput)).rejects.toThrow();
      // El flujo debe fallar sin crear estructuras parciales
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar nombres largos de proyecto', async () => {
      // ARRANGE
      const longName = 'A'.repeat(100);
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: longName,
          description: 'Test'
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe validar que entityType está en lista permitida', async () => {
      // ARRANGE
      const invalidInput: any = {
        entityType: 'invalid-type',
        data: { projectName: 'Test' }
      };

      // ACT
      const result = await CrossPluginFlow.validateFlowInput(invalidInput);

      // ASSERT
      expect(result.valid).toBe(false);
    });

    it('debe soportar descripción vacía (opcional)', async () => {
      // ARRANGE
      const input: FlowInput = {
        entityType: 'project',
        data: {
          projectName: 'No Description Project',
          description: '' // opcional
        }
      };

      // ACT
      const result = await CrossPluginFlow.executeCreateProjectFlow(input);

      // ASSERT
      expect(result.success).toBe(true);
    });
  });
});
