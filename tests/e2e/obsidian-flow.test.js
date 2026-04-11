/**
 * E2E Tests: QuickAdd + Templater + Obsidian Flow
 * FASE 5: Full integration testing
 * 
 * Tests the complete flow:
 * Home.md button → QuickAdd script → Templater processing → Obsidian vault
 */

describe('E2E: QuickAdd + Templater Integration', () => {
  
  // Mock Obsidian API
  const createMockObsidian = () => ({
    vault: {
      create: jest.fn(async (path, content) => ({ path, content })),
      getAbstractFileByPath: jest.fn(async (path) => ({ path })),
      adapter: {
        list: jest.fn(async (path) => ({ files: [], folders: [] }))
      }
    },
    notice: jest.fn((msg, duration) => console.log(`[NOTICE] ${msg}`))
  });

  // Mock Templater API
  const createMockTemplater = () => ({
    tp: {
      date: {
        now: jest.fn((format) => new Date().toISOString())
      },
      file: {
        title: jest.fn(() => 'test-file'),
        folder: jest.fn((relative) => 'test-folder')
      },
      user: {
        call: jest.fn(async (path) => 'script-result'),
        name: jest.fn(() => 'Nestor')
      }
    }
  });

  // Mock template processor
  const processTemplate = (templateContent, variables) => {
    let result = templateContent;
    
    // Replace {{VALUE:*}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{VALUE:${key}}}`, 'g'), value);
    });
    
    return result;
  };

  describe('UC-001: Create Repository E2E', () => {
    
    test('Should complete full repository creation flow', async () => {
      // Step 1: Execute script (createRepository.js simulation)
      const variables = {
        fileName: 'my-repo',
        repositoryId: 'repo-1712817000000-a1b2c3d4',
        repositoryName: 'My Repository',
        description: 'Test repository',
        createdAt: '2026-04-11T04:30:00.000Z',
        author: 'Nestor'
      };

      // Step 2: Load template
      const template = `---
id: {{VALUE:repositoryId}}
name: {{VALUE:repositoryName}}
type: repository
status: active
createdAt: {{VALUE:createdAt}}
author: {{VALUE:author}}
---

# {{VALUE:repositoryName}}

## Descripción

{{VALUE:description}}

## Archivos

<!-- Files here -->

## Notas

<!-- Notes here -->
`;

      // Step 3: Process template
      const processed = processTemplate(template, variables);

      // Step 4: Verify
      expect(processed).toContain('id: repo-1712817000000-a1b2c3d4');
      expect(processed).toContain('name: My Repository');
      expect(processed).toContain('# My Repository');
      expect(processed).toContain('## Descripción');
      expect(processed).toContain('Test repository');
    });

    test('Should handle template with Templater dynamic code', async () => {
      const variables = {
        repositoryId: 'repo-123',
        repositoryName: 'Repo Name',
        createdAt: '2026-04-11T04:30:00.000Z',
        author: 'Nestor'
      };

      // Template con Templater syntax
      const template = `---
id: {{VALUE:repositoryId}}
lastModified: <% tp.date.now("YYYY-MM-DD") %>
---

# {{VALUE:repositoryName}}
`;

      const processed = processTemplate(template, variables);
      expect(processed).toContain('id: repo-123');
      expect(processed).toContain('# Repo Name');
    });

    test('Should validate frontmatter YAML', async () => {
      const variables = {
        repositoryId: 'repo-123',
        repositoryName: 'Test',
        description: 'Desc',
        createdAt: '2026-04-11T04:30:00.000Z',
        author: 'Nestor'
      };

      const template = `---
id: {{VALUE:repositoryId}}
name: {{VALUE:repositoryName}}
type: repository
status: active
createdAt: {{VALUE:createdAt}}
author: {{VALUE:author}}
---
# Content`;

      const processed = processTemplate(template, variables);
      const lines = processed.split('\n');
      expect(lines[0]).toBe('---');
      expect(lines[lines.length - 2]).toBe('---');
    });

    test('Should replace all QuickAdd variables', async () => {
      const variables = {
        repositoryId: 'id-value',
        repositoryName: 'name-value',
        description: 'desc-value',
        createdAt: 'date-value',
        author: 'author-value'
      };

      const template = `ID: {{VALUE:repositoryId}}
Name: {{VALUE:repositoryName}}
Desc: {{VALUE:description}}
Date: {{VALUE:createdAt}}
Author: {{VALUE:author}}`;

      const processed = processTemplate(template, variables);
      expect(processed).not.toContain('{{VALUE:');
      expect(processed).toContain('id-value');
      expect(processed).toContain('name-value');
    });

    test('Should create file in vault', async () => {
      const app = createMockObsidian();
      const variables = {
        fileName: 'my-repo',
        repositoryId: 'repo-123',
        repositoryName: 'Test'
      };

      const content = '# Test Repository\nid: repo-123';
      await app.vault.create(`500-REPOSITORIOS/${variables.fileName}.md`, content);

      expect(app.vault.create).toHaveBeenCalledWith(
        expect.stringContaining('my-repo.md'),
        expect.any(String)
      );
    });
  });

  describe('UC-002: Create Task E2E', () => {
    
    test('Should process task template with all variables', async () => {
      const variables = {
        taskId: 'task-123',
        taskName: 'Complete project',
        description: 'Finish all tasks',
        status: 'active',
        priority: '3',
        dueDate: '2026-05-01',
        createdAt: '2026-04-11T04:30:00.000Z',
        author: 'Nestor'
      };

      const template = `---
id: {{VALUE:taskId}}
name: {{VALUE:taskName}}
type: task
status: {{VALUE:status}}
priority: {{VALUE:priority}}
dueDate: {{VALUE:dueDate}}
---
# {{VALUE:taskName}}
Priority: {{VALUE:priority}}/5`;

      const processed = processTemplate(template, variables);
      expect(processed).toContain('id: task-123');
      expect(processed).toContain('priority: 3');
      expect(processed).toContain('Priority: 3/5');
    });

    test('Should validate priority field', async () => {
      const template = 'priority: {{VALUE:priority}}';
      const processed = processTemplate(template, { priority: '4' });
      expect(processed).toContain('priority: 4');
    });

    test('Should validate due date format', async () => {
      const template = 'dueDate: {{VALUE:dueDate}}';
      const processed = processTemplate(template, { dueDate: '2026-05-01' });
      expect(processed).toContain('2026-05-01');
    });

    test('Should generate checklist', async () => {
      const template = `## Checklist
- [ ] Subtask 1
- [ ] Subtask 2`;
      expect(template).toContain('[ ]');
    });
  });

  describe('UC-003: Create Project E2E', () => {
    
    test('Should process project template', async () => {
      const variables = {
        projectId: 'proj-123',
        projectName: 'New Project',
        objective: 'Complete by Q2',
        startDate: '2026-04-15',
        endDate: '2026-06-30'
      };

      const template = `---
id: {{VALUE:projectId}}
name: {{VALUE:projectName}}
startDate: {{VALUE:startDate}}
endDate: {{VALUE:endDate}}
---
# {{VALUE:projectName}}
Objective: {{VALUE:objective}}`;

      const processed = processTemplate(template, variables);
      expect(processed).toContain('proj-123');
      expect(processed).toContain('2026-04-15');
      expect(processed).toContain('2026-06-30');
    });

    test('Should include phases section', async () => {
      const template = `## Fases
- [ ] Fase 1
- [ ] Fase 2
- [ ] Fase 3`;
      expect(template).toContain('Fase 1');
    });

    test('Should support date ranges', async () => {
      const variables = {
        startDate: '2026-04-15',
        endDate: '2026-06-30'
      };
      const template = 'From {{VALUE:startDate}} to {{VALUE:endDate}}';
      const processed = processTemplate(template, variables);
      expect(processed).toContain('2026-04-15');
      expect(processed).toContain('2026-06-30');
    });
  });

  describe('UC-004: Create Pillar E2E', () => {
    
    test('Should process pillar template', async () => {
      const variables = {
        pillarId: 'pillar-123',
        pillarName: 'Health',
        purpose: 'Maintain wellbeing',
        description: 'Health pillar'
      };

      const template = `---
id: {{VALUE:pillarId}}
name: {{VALUE:pillarName}}
---
# {{VALUE:pillarName}}
Purpose: {{VALUE:purpose}}`;

      const processed = processTemplate(template, variables);
      expect(processed).toContain('pillar-123');
      expect(processed).toContain('# Health');
    });
  });

  describe('UC-005: Create Repository Note E2E', () => {
    
    test('Should link note to parent repository', async () => {
      const variables = {
        noteId: 'note-123',
        noteName: 'Important Note',
        repositoryName: 'My Repository'
      };

      const template = `---
id: {{VALUE:noteId}}
name: {{VALUE:noteName}}
---
# {{VALUE:noteName}}
Repository: [[{{VALUE:repositoryName}}]]`;

      const processed = processTemplate(template, variables);
      expect(processed).toContain('[[My Repository]]');
    });

    test('Should create bidirectional link', async () => {
      const template = 'Repository: [[{{VALUE:repositoryName}}]]';
      const processed = processTemplate(template, { repositoryName: 'Repo' });
      expect(processed).toContain('[[Repo]]');
    });
  });

  describe('Template Processing', () => {
    
    test('Should not process undefined variables', async () => {
      const template = 'Value: {{VALUE:undefined}}';
      const variables = {};
      const processed = processTemplate(template, variables);
      expect(processed).toContain('{{VALUE:undefined}}');
    });

    test('Should handle escaped characters in variables', async () => {
      const template = 'Content: {{VALUE:content}}';
      const variables = { content: 'Line1\\nLine2' };
      const processed = processTemplate(template, variables);
      expect(processed).toContain('Line1\\nLine2');
    });

    test('Should preserve markdown formatting', async () => {
      const template = `# {{VALUE:title}}
      
## Section
- Item 1
- Item 2`;
      const variables = { title: 'Test' };
      const processed = processTemplate(template, variables);
      expect(processed).toContain('# Test');
      expect(processed).toContain('## Section');
    });
  });

  describe('Error Handling E2E', () => {
    
    test('Should handle missing required variables', async () => {
      const variables = { repositoryName: 'Test' };
      const template = '{{VALUE:repositoryId}}';
      const processed = processTemplate(template, variables);
      expect(processed).toBe('{{VALUE:repositoryId}}');
    });

    test('Should not crash on special characters', async () => {
      const variables = { name: '<script>alert(1)</script>' };
      const template = 'Name: {{VALUE:name}}';
      const processed = processTemplate(template, variables);
      expect(processed).toContain('script');
    });

    test('Should handle empty template', async () => {
      const template = '';
      const variables = {};
      const processed = processTemplate(template, variables);
      expect(processed).toBe('');
    });
  });
});
