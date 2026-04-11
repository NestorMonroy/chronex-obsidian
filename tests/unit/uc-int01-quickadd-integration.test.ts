/**
 * Tests para UC-INT01: Integración con QuickAdd
 * 
 * Test-Driven Development: Escribir tests PRIMERO
 * QuickAdd es un plugin de Obsidian para automatizar creación de notas
 * Esta integración registra macros y scripts automáticos
 * 
 * @see /docs/specification/use-cases/uc-int01-quickadd-integration.md
 */

import { QuickAddIntegration, MacroConfig, ScriptTemplate } from '../../src/services/uc-int01-quickadd-integration';

describe('UC-INT01: QuickAdd Integration', () => {
  
  describe('registerMacro', () => {
    it('debe registrar macro correctamente', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'create-project',
        name: 'Crear Proyecto',
        description: 'Crear nuevo proyecto en 200-PROYECTOS',
        trigger: 'cmd+shift+p',
        scriptPath: '990-UTILIDADES/992-script/create-project.js'
      };

      // ACT
      const result = await QuickAddIntegration.registerMacro(macroConfig);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.macroId).toBe('create-project');
    });

    it('debe validar macro ID es único', async () => {
      // ARRANGE
      const macro1: MacroConfig = {
        id: 'create-task',
        name: 'Crear Tarea',
        description: 'Nueva tarea',
        trigger: 'cmd+shift+t',
        scriptPath: 'scripts/create-task.js'
      };

      const macro2: MacroConfig = {
        id: 'create-task', // ID duplicado
        name: 'Otra Tarea',
        description: 'Otra tarea',
        trigger: 'cmd+shift+o',
        scriptPath: 'scripts/otro.js'
      };

      // ACT & ASSERT
      await QuickAddIntegration.registerMacro(macro1);
      await expect(QuickAddIntegration.registerMacro(macro2)).rejects.toThrow();
    });

    it('debe rechazar macro sin script path', async () => {
      // ARRANGE
      const invalidMacro: any = {
        id: 'test-macro',
        name: 'Test',
        description: 'Test',
        trigger: 'cmd+t'
        // Sin scriptPath
      };

      // ACT & ASSERT
      await expect(QuickAddIntegration.registerMacro(invalidMacro)).rejects.toThrow();
    });

    it('debe retornar información del macro registrado', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'test-macro',
        name: 'Test Macro',
        description: 'Test',
        trigger: 'cmd+t',
        scriptPath: 'scripts/test.js'
      };

      // ACT
      const result = await QuickAddIntegration.registerMacro(macroConfig);

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('macroId');
      expect(result).toHaveProperty('message');
    });
  });

  describe('createScriptTemplate', () => {
    it('debe crear template de script para nota de proyecto', async () => {
      // ARRANGE
      const template: ScriptTemplate = {
        type: 'project',
        name: 'Plantilla Proyecto',
        variables: {
          projectName: 'Nombre del Proyecto',
          description: 'Descripción'
        },
        scriptCode: `
          const name = tp.system.prompt("Nombre del proyecto");
          // Script para crear proyecto
        `
      };

      // ACT
      const result = await QuickAddIntegration.createScriptTemplate(template);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
    });

    it('debe validar template tiene tipo válido', async () => {
      // ARRANGE
      const invalidTemplate: any = {
        type: 'invalid-type',
        name: 'Template',
        variables: {},
        scriptCode: 'code'
      };

      // ACT & ASSERT
      await expect(QuickAddIntegration.createScriptTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('debe soportar múltiples tipos de templates', async () => {
      // ARRANGE
      const types = ['project', 'objective', 'task', 'document', 'note'];
      const templates = types.map(type => ({
        type,
        name: `Template ${type}`,
        variables: {},
        scriptCode: 'code'
      }));

      // ACT & ASSERT
      for (const template of templates) {
        const result = await QuickAddIntegration.createScriptTemplate(template as ScriptTemplate);
        expect(result.success).toBe(true);
      }
    });

    it('debe retener variables del template', async () => {
      // ARRANGE
      const template: ScriptTemplate = {
        type: 'task',
        name: 'Task Template',
        variables: {
          taskName: 'Nombre de la tarea',
          priority: 'Prioridad',
          dueDate: 'Fecha de vencimiento'
        },
        scriptCode: 'code'
      };

      // ACT
      const result = await QuickAddIntegration.createScriptTemplate(template);

      // ASSERT
      expect(result.variables).toEqual(template.variables);
    });
  });

  describe('registerDefaultMacros', () => {
    it('debe registrar todos los macros por defecto', async () => {
      // ACT
      const result = await QuickAddIntegration.registerDefaultMacros();

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.macrosRegistered).toBeGreaterThan(0);
    });

    it('debe incluir macros para crear entidades principales', async () => {
      // ACT
      const result = await QuickAddIntegration.registerDefaultMacros();

      // ASSERT
      expect(result.macroIds).toContain('create-project');
      expect(result.macroIds).toContain('create-objective');
      expect(result.macroIds).toContain('create-task');
    });

    it('debe retornar lista de todos los macros registrados', async () => {
      // ACT
      const result = await QuickAddIntegration.registerDefaultMacros();

      // ASSERT
      expect(result.macroIds).toBeInstanceOf(Array);
      expect(result.macroIds.length).toBeGreaterThan(0);
    });

    it('debe usar templates correctos para cada macro', async () => {
      // ACT
      const result = await QuickAddIntegration.registerDefaultMacros();

      // ASSERT
      expect(result.macrosRegistered).toBeGreaterThan(0);
      expect(result.message).toContain('exitosa');
    });
  });

  describe('listMacros', () => {
    it('debe listar todos los macros registrados', async () => {
      // ARRANGE
      await QuickAddIntegration.registerDefaultMacros();

      // ACT
      const macros = await QuickAddIntegration.listMacros();

      // ASSERT
      expect(macros).toBeInstanceOf(Array);
      expect(macros.length).toBeGreaterThan(0);
    });

    it('debe retornar macros con información completa', async () => {
      // ARRANGE
      await QuickAddIntegration.registerDefaultMacros();

      // ACT
      const macros = await QuickAddIntegration.listMacros();

      // ASSERT
      macros.forEach(macro => {
        expect(macro).toHaveProperty('id');
        expect(macro).toHaveProperty('name');
        expect(macro).toHaveProperty('description');
      });
    });

    it('debe retornar array vacío si no hay macros', async () => {
      // ACT
      const macros = await QuickAddIntegration.listMacros();

      // ASSERT
      expect(Array.isArray(macros)).toBe(true);
    });
  });

  describe('executeMacro', () => {
    it('debe ejecutar macro registrado', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'test-execute',
        name: 'Test Execute',
        description: 'Test',
        trigger: 'cmd+e',
        scriptPath: 'scripts/test.js'
      };

      await QuickAddIntegration.registerMacro(macroConfig);

      // ACT
      const result = await QuickAddIntegration.executeMacro('test-execute', {});

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.macroId).toBe('test-execute');
    });

    it('debe rechazar ejecución de macro no registrado', async () => {
      // ACT & ASSERT
      await expect(QuickAddIntegration.executeMacro('non-existent', {})).rejects.toThrow();
    });

    it('debe pasar variables al script del macro', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'macro-vars',
        name: 'Macro with vars',
        description: 'Test',
        trigger: 'cmd+v',
        scriptPath: 'scripts/vars.js'
      };

      await QuickAddIntegration.registerMacro(macroConfig);

      // ACT
      const variables = { projectName: 'Mi Proyecto', description: 'Descripción' };
      const result = await QuickAddIntegration.executeMacro('macro-vars', variables);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.variablesPassed).toEqual(variables);
    });

    it('debe retornar resultado de ejecución', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'result-macro',
        name: 'Result Macro',
        description: 'Test',
        trigger: 'cmd+r',
        scriptPath: 'scripts/result.js'
      };

      await QuickAddIntegration.registerMacro(macroConfig);

      // ACT
      const result = await QuickAddIntegration.executeMacro('result-macro', {});

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
    });
  });

  describe('unregisterMacro', () => {
    it('debe desregistrar macro existente', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'to-remove',
        name: 'To Remove',
        description: 'Test',
        trigger: 'cmd+x',
        scriptPath: 'scripts/remove.js'
      };

      await QuickAddIntegration.registerMacro(macroConfig);

      // ACT
      const result = await QuickAddIntegration.unregisterMacro('to-remove');

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.message).toContain('removido');
    });

    it('debe rechazar desregistro de macro no existente', async () => {
      // ACT & ASSERT
      await expect(QuickAddIntegration.unregisterMacro('non-existent')).rejects.toThrow();
    });

    it('debe permitir re-registrar después de desregistrar', async () => {
      // ARRANGE
      const macroConfig: MacroConfig = {
        id: 'reregister',
        name: 'Reregister',
        description: 'Test',
        trigger: 'cmd+g',
        scriptPath: 'scripts/reg.js'
      };

      // ACT
      await QuickAddIntegration.registerMacro(macroConfig);
      await QuickAddIntegration.unregisterMacro('reregister');
      const result = await QuickAddIntegration.registerMacro(macroConfig);

      // ASSERT
      expect(result.success).toBe(true);
    });
  });

  describe('Integration: Complete QuickAdd Setup', () => {
    it('debe completar setup de QuickAdd end-to-end', async () => {
      // ARRANGE & ACT
      const registerResult = await QuickAddIntegration.registerDefaultMacros();
      const listResult = await QuickAddIntegration.listMacros();

      // ASSERT
      expect(registerResult.success).toBe(true);
      expect(listResult.length).toBeGreaterThanOrEqual(registerResult.macrosRegistered);
    });

    it('debe permitir crear y ejecutar macro personalizado', async () => {
      // ARRANGE
      const customMacro: MacroConfig = {
        id: 'custom-macro',
        name: 'Custom Macro',
        description: 'Custom',
        trigger: 'cmd+n',
        scriptPath: 'scripts/custom.js'
      };

      // ACT
      const registerResult = await QuickAddIntegration.registerMacro(customMacro);
      const executeResult = await QuickAddIntegration.executeMacro('custom-macro', {});

      // ASSERT
      expect(registerResult.success).toBe(true);
      expect(executeResult.success).toBe(true);
    });

    it('debe permitir cambios dinámicos en macros', async () => {
      // ARRANGE
      const macro1: MacroConfig = {
        id: 'dynamic-1',
        name: 'Dynamic 1',
        description: 'First',
        trigger: 'cmd+d',
        scriptPath: 'scripts/dynamic.js'
      };

      // ACT
      await QuickAddIntegration.registerMacro(macro1);
      const beforeList = await QuickAddIntegration.listMacros();
      await QuickAddIntegration.unregisterMacro('dynamic-1');
      const afterList = await QuickAddIntegration.listMacros();

      // ASSERT
      expect(beforeList.length).toBeGreaterThan(afterList.length);
    });
  });

  describe('Error Handling', () => {
    it('debe proporcionar mensajes de error claros', async () => {
      // ARRANGE
      const invalidMacro: any = {
        id: '',
        name: 'Invalid',
        description: 'Invalid'
      };

      // ACT & ASSERT
      try {
        await QuickAddIntegration.registerMacro(invalidMacro);
      } catch (error: any) {
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('debe manejar errores de script path inválido', async () => {
      // ARRANGE
      const macro: MacroConfig = {
        id: 'invalid-path',
        name: 'Invalid Path',
        description: 'Invalid',
        trigger: 'cmd+i',
        scriptPath: ''
      };

      // ACT & ASSERT
      await expect(QuickAddIntegration.registerMacro(macro)).rejects.toThrow();
    });

    it('debe validar trigger format', async () => {
      // ARRANGE
      const macro: MacroConfig = {
        id: 'bad-trigger',
        name: 'Bad Trigger',
        description: 'Bad',
        trigger: 'invalid-trigger-format',
        scriptPath: 'scripts/test.js'
      };

      // ACT & ASSERT
      // Trigger validation (cmd+x or alt+x format)
      try {
        await QuickAddIntegration.registerMacro(macro);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar macro IDs con guiones', async () => {
      // ARRANGE
      const macro: MacroConfig = {
        id: 'create-new-project-task',
        name: 'Create Project Task',
        description: 'Test',
        trigger: 'cmd+shift+n',
        scriptPath: 'scripts/test.js'
      };

      // ACT
      const result = await QuickAddIntegration.registerMacro(macro);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.macroId).toBe('create-new-project-task');
    });

    it('debe permitir macros con descripciones largas', async () => {
      // ARRANGE
      const longDescription = 'Esta es una descripción muy larga que explica en detalle qué hace el macro y cómo usarlo correctamente en diferentes escenarios';
      const macro: MacroConfig = {
        id: 'long-desc',
        name: 'Long Description',
        description: longDescription,
        trigger: 'cmd+l',
        scriptPath: 'scripts/long.js'
      };

      // ACT
      const result = await QuickAddIntegration.registerMacro(macro);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe soportar múltiples triggers con alt/cmd', async () => {
      // ARRANGE
      const macros: MacroConfig[] = [
        {
          id: 'macro-cmd',
          name: 'Cmd Trigger',
          description: 'Test',
          trigger: 'cmd+k',
          scriptPath: 'scripts/cmd.js'
        },
        {
          id: 'macro-alt',
          name: 'Alt Trigger',
          description: 'Test',
          trigger: 'alt+a',
          scriptPath: 'scripts/alt.js'
        },
        {
          id: 'macro-shift',
          name: 'Shift Trigger',
          description: 'Test',
          trigger: 'cmd+shift+s',
          scriptPath: 'scripts/shift.js'
        }
      ];

      // ACT & ASSERT
      for (const macro of macros) {
        const result = await QuickAddIntegration.registerMacro(macro);
        expect(result.success).toBe(true);
      }
    });
  });
});
