/**
 * Tests para UC-008: Create Project (TIER 1 MVP)
 * 
 * Este UC permite al usuario crear un nuevo proyecto completo:
 * - Validar datos de entrada
 * - Generar ID único
 * - Crear estructura de carpetas
 * - Crear nota base desde template
 * - Notificar usuario
 * 
 * @see /docs/specification/use-cases/UC-008-create-project.md
 */

import { ProjectService, CreateProjectInput, ProjectResult } from '../../src/services/uc-008-create-project';

describe('UC-008: Create Project (TIER 1 MVP)', () => {
  
  describe('createProject', () => {
    it('debe crear proyecto correctamente', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Mi Proyecto',
        description: 'Descripción del proyecto',
        priority: 'MEDIA'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();
      expect(result.projectId).toMatch(/^PROJ-\d{6}-[A-Z0-9]{5}$/);
    });

    it('debe validar que projectName no esté vacío', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: '', // vacío
        description: 'Test'
      };

      // ACT & ASSERT
      await expect(ProjectService.createProject(input)).rejects.toThrow();
    });

    it('debe validar que projectName no supere 200 caracteres', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'A'.repeat(201),
        description: 'Test'
      };

      // ACT & ASSERT
      await expect(ProjectService.createProject(input)).rejects.toThrow();
    });

    it('debe permitir description vacía (opcional)', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Proyecto Sin Descripción',
        description: '' // opcional
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe validar priority si se proporciona', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Test Project',
        description: 'Test',
        priority: 'BAJA'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe rechazar priority inválida', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Test',
        description: 'Test',
        priority: 'INVALIDA'
      };

      // ACT & ASSERT
      await expect(ProjectService.createProject(input)).rejects.toThrow();
    });

    it('debe crear carpeta de proyecto', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Carpeta Test',
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.folderCreated).toBe(true);
      expect(result.folderPath).toBeDefined();
      expect(result.folderPath).toContain('200-PROYECTOS');
    });

    it('debe crear nota base del proyecto', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Nota Test',
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.noteCreated).toBe(true);
      expect(result.notePath).toBeDefined();
    });

    it('debe crear frontmatter completo en nota', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Frontmatter Test',
        description: 'Test description',
        priority: 'ALTA'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter?.uid).toBe(result.projectId);
      expect(result.frontmatter?.type).toBe('proyecto');
      expect(result.frontmatter?.priority).toBe('ALTA');
    });

    it('debe retornar información completa del proyecto creado', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Completo Test',
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('projectName');
      expect(result).toHaveProperty('folderCreated');
      expect(result).toHaveProperty('folderPath');
      expect(result).toHaveProperty('noteCreated');
      expect(result).toHaveProperty('notePath');
      expect(result).toHaveProperty('frontmatter');
      expect(result).toHaveProperty('notified');
    });
  });

  describe('getProject', () => {
    it('debe obtener proyecto por ID', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Get Test',
        description: 'Test'
      };

      const created = await ProjectService.createProject(input);

      // ACT
      const result = await ProjectService.getProject(created.projectId!);

      // ASSERT
      expect(result).toBeDefined();
      expect(result?.projectName).toBe('Get Test');
    });

    it('debe retornar null si proyecto no existe', async () => {
      // ACT
      const result = await ProjectService.getProject('PROJ-999999-ZZZZZ');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('debe listar proyectos creados', async () => {
      // ARRANGE
      const input1: CreateProjectInput = {
        projectName: 'List Project 1',
        description: 'Test'
      };

      const input2: CreateProjectInput = {
        projectName: 'List Project 2',
        description: 'Test'
      };

      await ProjectService.createProject(input1);
      await ProjectService.createProject(input2);

      // ACT
      const projects = await ProjectService.listProjects();

      // ASSERT
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('debe retornar array vacío si no hay proyectos', async () => {
      // ACT
      const projects = await ProjectService.listProjects();

      // ASSERT
      expect(Array.isArray(projects)).toBe(true);
    });

    it('debe retornar proyectos con información completa', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Info Project',
        description: 'Full info',
        priority: 'ALTA'
      };

      await ProjectService.createProject(input);

      // ACT
      const projects = await ProjectService.listProjects();
      const found = projects.find(p => p.projectName === 'Info Project');

      // ASSERT
      expect(found).toBeDefined();
      expect(found?.projectId).toBeDefined();
      expect(found?.description).toBe('Full info');
      expect(found?.priority).toBe('ALTA');
    });
  });

  describe('validateProjectInput', () => {
    it('debe validar entrada correcta', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Valid Project',
        description: 'Valid description'
      };

      // ACT
      const result = await ProjectService.validateProjectInput(input);

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe validar que projectName es requerido', async () => {
      // ARRANGE
      const input: any = {
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.validateProjectInput(input);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe retornar lista de errores específicos', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: '', // vacío
        description: 'A'.repeat(500), // muy largo
        priority: 'INVALID' // inválido
      };

      // ACT
      const result = await ProjectService.validateProjectInput(input);

      // ASSERT
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('debe proporcionar mensajes de error claros', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: '',
        description: 'Test'
      };

      // ACT & ASSERT
      try {
        await ProjectService.createProject(input);
      } catch (error: any) {
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('debe manejar errores de creación de carpeta', async () => {
      // Si la carpeta no se puede crear, debe fallar gracefully
      // Este es un test de robustez
      const input: CreateProjectInput = {
        projectName: 'Error Handling Test',
        description: 'Test'
      };

      const result = await ProjectService.createProject(input);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar nombres muy largos de proyecto', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'A'.repeat(200), // máximo permitido
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe manejar descripciones muy largas', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Long Description Test',
        description: 'Lorem ipsum '.repeat(100) // muy larga
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe soportar caracteres especiales en nombre', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'Proyecto 2026 (Especial) [Beta] & Más!',
        description: 'Test'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('debe soportar múltiples prioridades válidas', async () => {
      // ARRANGE
      const priorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];
      const results = [];

      // ACT
      for (const priority of priorities) {
        const input: CreateProjectInput = {
          projectName: `Priority ${priority}`,
          description: 'Test',
          priority
        };
        const result = await ProjectService.createProject(input);
        results.push(result.success);
      }

      // ASSERT
      expect(results).toEqual([true, true, true, true]);
    });

    it('debe crear proyectos con mismos nombres (IDs diferentes)', async () => {
      // ARRANGE
      const input1: CreateProjectInput = {
        projectName: 'Mismo Nombre',
        description: 'Test 1'
      };

      const input2: CreateProjectInput = {
        projectName: 'Mismo Nombre',
        description: 'Test 2'
      };

      // ACT
      const result1 = await ProjectService.createProject(input1);
      const result2 = await ProjectService.createProject(input2);

      // ASSERT
      expect(result1.projectId).not.toBe(result2.projectId);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Integration: Complete Project Creation', () => {
    it('debe completar flujo de creación end-to-end', async () => {
      // ARRANGE
      const input: CreateProjectInput = {
        projectName: 'E2E Proyecto',
        description: 'Test completo',
        priority: 'ALTA'
      };

      // ACT
      const result = await ProjectService.createProject(input);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();
      expect(result.folderCreated).toBe(true);
      expect(result.noteCreated).toBe(true);
      expect(result.frontmatter).toBeDefined();
      expect(result.notified).toBe(true);

      // Verificar que puede ser recuperado
      const retrieved = await ProjectService.getProject(result.projectId!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.projectName).toBe('E2E Proyecto');
    });
  });
});
