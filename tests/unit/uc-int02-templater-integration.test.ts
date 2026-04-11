/**
 * Tests para UC-INT02: Integración con Templater
 * 
 * Test-Driven Development: Escribir tests PRIMERO
 * Templater es un plugin de Obsidian para procesar templates dinámicos
 * Esta integración registra y procesa templates para crear notas automáticas
 * 
 * @see /docs/specification/use-cases/uc-int02-templater-integration.md
 */

import { TemplaterIntegration, TemplateConfig, TemplateData } from '../../src/services/uc-int02-templater-integration';

describe('UC-INT02: Templater Integration', () => {
  
  describe('registerTemplate', () => {
    it('debe registrar template correctamente', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'project-template',
        name: 'Project Template',
        description: 'Template para crear proyectos',
        filePath: '990-UTILIDADES/991-templates/project.md',
        templateType: 'project',
        variables: {
          projectName: 'Nombre del proyecto',
          description: 'Descripción'
        }
      };

      // ACT
      const result = await TemplaterIntegration.registerTemplate(templateConfig);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.templateId).toBe('project-template');
    });

    it('debe validar que template ID es único', async () => {
      // ARRANGE
      const template1: TemplateConfig = {
        id: 'unique-template',
        name: 'Template 1',
        description: 'First',
        filePath: 'path1.md',
        templateType: 'project',
        variables: {}
      };

      const template2: TemplateConfig = {
        id: 'unique-template', // ID duplicado
        name: 'Template 2',
        description: 'Second',
        filePath: 'path2.md',
        templateType: 'task',
        variables: {}
      };

      // ACT & ASSERT
      await TemplaterIntegration.registerTemplate(template1);
      await expect(TemplaterIntegration.registerTemplate(template2)).rejects.toThrow();
    });

    it('debe rechazar template sin filePath', async () => {
      // ARRANGE
      const invalidTemplate: any = {
        id: 'invalid',
        name: 'Invalid',
        description: 'Invalid',
        templateType: 'project',
        variables: {}
        // Sin filePath
      };

      // ACT & ASSERT
      await expect(TemplaterIntegration.registerTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('debe retornar información del template registrado', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test',
        filePath: 'test.md',
        templateType: 'note',
        variables: { title: 'Title' }
      };

      // ACT
      const result = await TemplaterIntegration.registerTemplate(templateConfig);

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('templateId');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('variables');
    });
  });

  describe('processTemplate', () => {
    it('debe procesar template con variables', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'process-template',
        name: 'Process Template',
        description: 'Test',
        filePath: 'process.md',
        templateType: 'project',
        variables: { projectName: 'Project', description: 'Desc' }
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      const data: TemplateData = {
        projectName: 'Mi Proyecto',
        description: 'Mi descripción'
      };

      // ACT
      const result = await TemplaterIntegration.processTemplate('process-template', data);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.processedContent).toBeDefined();
      expect(typeof result.processedContent).toBe('string');
    });

    it('debe rechazar template inexistente', async () => {
      // ACT & ASSERT
      await expect(
        TemplaterIntegration.processTemplate('non-existent', {})
      ).rejects.toThrow();
    });

    it('debe validar que todas las variables requeridas están presentes', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'var-template',
        name: 'Var Template',
        description: 'Test',
        filePath: 'var.md',
        templateType: 'project',
        variables: {
          projectName: 'Project',
          description: 'Description',
          priority: 'Priority'
        }
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      // Faltan variables requeridas
      const incompleteData: TemplateData = {
        projectName: 'Test'
        // Falta description y priority
      };

      // ACT & ASSERT
      await expect(
        TemplaterIntegration.processTemplate('var-template', incompleteData)
      ).rejects.toThrow();
    });

    it('debe retornar contenido procesado', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'output-template',
        name: 'Output Template',
        description: 'Test',
        filePath: 'output.md',
        templateType: 'task',
        variables: { taskName: 'Task', dueDate: 'Date' }
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      const data: TemplateData = {
        taskName: 'Mi Tarea',
        dueDate: '2026-04-15'
      };

      // ACT
      const result = await TemplaterIntegration.processTemplate('output-template', data);

      // ASSERT
      expect(result.processedContent).toContain('taskName' || 'Mi Tarea');
    });
  });

  describe('createNoteFromTemplate', () => {
    it('debe crear nota desde template', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'create-template',
        name: 'Create Template',
        description: 'Test',
        filePath: 'create.md',
        templateType: 'project',
        variables: { name: 'Name', desc: 'Description' }
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      const noteData: TemplateData = {
        name: 'Nueva Nota',
        desc: 'Descripción de la nota'
      };

      // ACT
      const result = await TemplaterIntegration.createNoteFromTemplate(
        'create-template',
        'Nueva Nota', // nota filename
        noteData
      );

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.noteFileName).toBe('Nueva Nota');
      expect(result.content).toBeDefined();
    });

    it('debe validar nombre de nota no esté vacío', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'name-template',
        name: 'Name Template',
        description: 'Test',
        filePath: 'name.md',
        templateType: 'task',
        variables: {}
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      // ACT & ASSERT
      await expect(
        TemplaterIntegration.createNoteFromTemplate('name-template', '', {})
      ).rejects.toThrow();
    });

    it('debe retornar contenido de nota creada', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'note-template',
        name: 'Note Template',
        description: 'Test',
        filePath: 'note.md',
        templateType: 'document',
        variables: { title: 'Title' }
      };

      await TemplaterIntegration.registerTemplate(templateConfig);

      // ACT
      const result = await TemplaterIntegration.createNoteFromTemplate(
        'note-template',
        'Test Note',
        { title: 'Mi Título' }
      );

      // ASSERT
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('validateTemplateSyntax', () => {
    it('debe validar syntax de template correcto', async () => {
      // ARRANGE
      const validSyntax = `
# {{projectName}}

{{description}}

Created: {{date}}
      `;

      // ACT
      const result = await TemplaterIntegration.validateTemplateSyntax(validSyntax);

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe detectar variables no cerradas', async () => {
      // ARRANGE
      const invalidSyntax = '# {{projectName';

      // ACT
      const result = await TemplaterIntegration.validateTemplateSyntax(invalidSyntax);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe detectar delimitadores inconsistentes', async () => {
      // ARRANGE
      const invalidSyntax = '# {{projectName}} text {{{extra}}}';

      // ACT
      const result = await TemplaterIntegration.validateTemplateSyntax(invalidSyntax);

      // ASSERT
      expect(result.valid).toBe(false);
    });

    it('debe retornar lista de variables encontradas', async () => {
      // ARRANGE
      const templateWithVars = `
# {{projectName}}
Description: {{description}}
Priority: {{priority}}
      `;

      // ACT
      const result = await TemplaterIntegration.validateTemplateSyntax(templateWithVars);

      // ASSERT
      expect(result.variables).toBeInstanceOf(Array);
      expect(result.variables.length).toBeGreaterThan(0);
    });
  });

  describe('listTemplates', () => {
    it('debe listar todos los templates registrados', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'list-template',
        name: 'List Template',
        description: 'Test',
        filePath: 'list.md',
        templateType: 'project',
        variables: {}
      };

      await TemplaterIntegration.registerTemplate(template);

      // ACT
      const templates = await TemplaterIntegration.listTemplates();

      // ASSERT
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('debe retornar templates con información completa', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'info-template',
        name: 'Info Template',
        description: 'Test description',
        filePath: 'info.md',
        templateType: 'task',
        variables: { var1: 'Variable 1' }
      };

      await TemplaterIntegration.registerTemplate(template);

      // ACT
      const templates = await TemplaterIntegration.listTemplates();

      // ASSERT
      const found = templates.find(t => t.id === 'info-template');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Info Template');
      expect(found?.variables).toEqual({ var1: 'Variable 1' });
    });
  });

  describe('unregisterTemplate', () => {
    it('debe desregistrar template existente', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'remove-template',
        name: 'Remove Template',
        description: 'Test',
        filePath: 'remove.md',
        templateType: 'project',
        variables: {}
      };

      await TemplaterIntegration.registerTemplate(template);

      // ACT
      const result = await TemplaterIntegration.unregisterTemplate('remove-template');

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.message).toContain('removido');
    });

    it('debe rechazar desregistro de template inexistente', async () => {
      // ACT & ASSERT
      await expect(TemplaterIntegration.unregisterTemplate('non-existent')).rejects.toThrow();
    });
  });

  describe('Integration: Complete Templater Setup', () => {
    it('debe permitir registro, procesamiento y creación de nota', async () => {
      // ARRANGE
      const templateConfig: TemplateConfig = {
        id: 'integration-template',
        name: 'Integration Template',
        description: 'Full integration test',
        filePath: 'integration.md',
        templateType: 'project',
        variables: {
          projectName: 'Project Name',
          description: 'Description'
        }
      };

      // ACT
      const registerResult = await TemplaterIntegration.registerTemplate(templateConfig);
      const processResult = await TemplaterIntegration.processTemplate(
        'integration-template',
        { projectName: 'Mi Proyecto', description: 'Mi descripción' }
      );
      const createResult = await TemplaterIntegration.createNoteFromTemplate(
        'integration-template',
        'Nueva Nota',
        { projectName: 'Mi Proyecto', description: 'Mi descripción' }
      );

      // ASSERT
      expect(registerResult.success).toBe(true);
      expect(processResult.success).toBe(true);
      expect(createResult.success).toBe(true);
    });

    it('debe permitir cambios dinámicos en templates', async () => {
      // ARRANGE
      const template1: TemplateConfig = {
        id: 'dynamic-template',
        name: 'Dynamic',
        description: 'Test',
        filePath: 'dynamic.md',
        templateType: 'task',
        variables: { name: 'Name' }
      };

      // ACT
      await TemplaterIntegration.registerTemplate(template1);
      const beforeList = await TemplaterIntegration.listTemplates();
      await TemplaterIntegration.unregisterTemplate('dynamic-template');
      const afterList = await TemplaterIntegration.listTemplates();

      // ASSERT
      expect(beforeList.length).toBeGreaterThan(afterList.length);
    });
  });

  describe('Error Handling', () => {
    it('debe proporcionar mensajes de error claros', async () => {
      // ARRANGE
      const invalidTemplate: any = {
        id: '',
        name: 'Invalid',
        description: 'Invalid'
      };

      // ACT & ASSERT
      try {
        await TemplaterIntegration.registerTemplate(invalidTemplate);
      } catch (error: any) {
        expect(error.message).toBeTruthy();
      }
    });

    it('debe validar filePath no esté vacío', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'empty-path',
        name: 'Empty Path',
        description: 'Test',
        filePath: '', // vacío
        templateType: 'project',
        variables: {}
      };

      // ACT & ASSERT
      await expect(TemplaterIntegration.registerTemplate(template)).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar template IDs con guiones', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'my-template-with-hyphens',
        name: 'Hyphenated',
        description: 'Test',
        filePath: 'hyphenated.md',
        templateType: 'project',
        variables: {}
      };

      // ACT
      const result = await TemplaterIntegration.registerTemplate(template);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.templateId).toBe('my-template-with-hyphens');
    });

    it('debe soportar templates con muchas variables', async () => {
      // ARRANGE
      const variables: Record<string, string> = {};
      for (let i = 1; i <= 20; i++) {
        variables[`var${i}`] = `Variable ${i}`;
      }

      const template: TemplateConfig = {
        id: 'many-vars',
        name: 'Many Variables',
        description: 'Test',
        filePath: 'many.md',
        templateType: 'task',
        variables
      };

      // ACT
      const result = await TemplaterIntegration.registerTemplate(template);

      // ASSERT
      expect(result.success).toBe(true);
      expect(Object.keys(result.variables).length).toBe(20);
    });

    it('debe permitir templates con paths complejos', async () => {
      // ARRANGE
      const template: TemplateConfig = {
        id: 'complex-path',
        name: 'Complex Path',
        description: 'Test',
        filePath: '990-UTILIDADES/991-templates/projects/2026/advanced-project.md',
        templateType: 'project',
        variables: {}
      };

      // ACT
      const result = await TemplaterIntegration.registerTemplate(template);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe validar templateType está en lista permitida', async () => {
      // ARRANGE
      const template: any = {
        id: 'bad-type',
        name: 'Bad Type',
        description: 'Test',
        filePath: 'bad.md',
        templateType: 'invalid-type', // no permitido
        variables: {}
      };

      // ACT & ASSERT
      await expect(TemplaterIntegration.registerTemplate(template)).rejects.toThrow();
    });
  });
});
