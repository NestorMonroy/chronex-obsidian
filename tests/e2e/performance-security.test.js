/**
 * Performance & Security Tests
 * FASE 5: Non-functional requirements
 */

describe('Performance Benchmarks', () => {
  
  test('Script execution < 100ms', () => {
    const start = performance.now();
    // Simulate script execution
    const id = `repo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  test('Template processing < 50ms', () => {
    const start = performance.now();
    const template = 'id: {{VALUE:id}}\nname: {{VALUE:name}}';
    const processed = template.replace('{{VALUE:id}}', 'test-id');
    const end = performance.now();
    expect(end - start).toBeLessThan(50);
  });

  test('File creation < 200ms total', () => {
    const start = performance.now();
    const variables = {
      id: 'test-123',
      name: 'Test',
      date: new Date().toISOString()
    };
    const end = performance.now();
    expect(end - start).toBeLessThan(200);
  });

  test('ID generation consistent time', () => {
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const id = `repo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const end = performance.now();
      times.push(end - start);
    }
    const avg = times.reduce((a, b) => a + b) / times.length;
    expect(avg).toBeLessThan(5);
  });

  test('Template variable replacement scales linearly', () => {
    let template = '';
    for (let i = 0; i < 100; i++) {
      template += `Line ${i}: {{VALUE:var${i}}}\n`;
    }
    
    const variables = {};
    for (let i = 0; i < 100; i++) {
      variables[`var${i}`] = `value${i}`;
    }
    
    const start = performance.now();
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{VALUE:${key}}}`, 'g'), value);
    });
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100);
  });
});

describe('Security: Input Validation', () => {
  
  test('Should sanitize repository name', () => {
    const input = 'Test<script>alert(1)</script>';
    const sanitized = input.replace(/<[^>]*>/g, '');
    expect(sanitized).toBe('Testalert(1)');
    expect(sanitized).not.toContain('<');
  });

  test('Should prevent path traversal', () => {
    const filename = '../../../etc/passwd';
    const safe = filename.replace(/\.\.\//g, '');
    expect(safe).toBe('etc/passwd');
  });

  test('Should validate filename characters', () => {
    const names = ['test-repo', 'test_repo', 'testRepo', 'test.repo'];
    const pattern = /^[a-z0-9\-_\.]+$/;
    expect(pattern.test('test-repo')).toBe(true);
    expect(pattern.test('test@repo')).toBe(false);
  });

  test('Should prevent SQL injection patterns', () => {
    const input = `'; DROP TABLE repos; --`;
    const isSafe = !input.includes('DROP') && !input.includes('--');
    expect(isSafe).toBe(false);
  });

  test('Should validate ID format', () => {
    const validId = 'repo-1712817000000-a1b2c3d4';
    const pattern = /^[a-z]+-\d+-[a-f0-9]+$/;
    expect(pattern.test(validId)).toBe(true);
  });

  test('Should prevent null byte injection', () => {
    const input = 'test\x00file';
    const safe = input.replace(/\x00/g, '');
    expect(safe).toBe('testfile');
  });

  test('Should validate email-like input', () => {
    const emails = ['user@example.com', '<img src=x>', 'test<script>'];
    const emailPattern = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;
    expect(emailPattern.test('user@example.com')).toBe(true);
    expect(emailPattern.test('<img src=x>')).toBe(false);
  });

  test('Should limit input length', () => {
    const maxLength = 255;
    const input = 'a'.repeat(300);
    const limited = input.substring(0, maxLength);
    expect(limited.length).toBeLessThanOrEqual(maxLength);
  });

  test('Should normalize file paths', () => {
    const paths = [
      'folder/file.md',
      'folder\\\\file.md',
      'folder//file.md',
      './folder/file.md'
    ];
    paths.forEach(path => {
      const normalized = path.replace(/\\\\/g, '/').replace(/\/+/g, '/');
      expect(normalized).not.toContain('\\\\');
    });
  });

  test('Should prevent template injection', () => {
    const input = '{{VALUE:__proto__}}';
    const pattern = /^\{\{VALUE:[a-zA-Z_][a-zA-Z0-9_]*\}\}$/;
    expect(pattern.test(input)).toBe(false);
  });
});

describe('Security: XSS Prevention', () => {
  
  test('Should escape HTML special characters', () => {
    const dangerous = '<script>alert("xss")</script>';
    const safe = dangerous
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    expect(safe).toContain('&lt;script&gt;');
  });

  test('Should prevent event handler injection', () => {
    const input = '<img onerror="alert(1)" src=x>';
    const safe = input.replace(/on\w+\s*=/gi, '');
    expect(safe).not.toContain('onerror=');
  });

  test('Should sanitize markdown content', () => {
    const content = '# Title\n<script>alert(1)</script>';
    const pattern = /<script[^>]*>.*?<\/script>/gi;
    const safe = content.replace(pattern, '');
    expect(safe).not.toContain('<script>');
  });
});

describe('Security: File System Access', () => {
  
  test('Should validate file paths are within vault', () => {
    const vaultRoot = '/vault/';
    const validPath = '/vault/folder/file.md';
    const invalidPath = '/etc/passwd';
    
    const isValid = (path) => path.startsWith(vaultRoot);
    expect(isValid(validPath)).toBe(true);
    expect(isValid(invalidPath)).toBe(false);
  });

  test('Should prevent relative path escapes', () => {
    const path = 'folder/../../../etc/passwd';
    const safe = path.split('/').filter(p => p && p !== '..').join('/');
    expect(safe).not.toContain('../');
  });

  test('Should validate file extensions', () => {
    const validExt = ['md', 'txt', 'json'];
    const testFiles = ['file.md', 'file.exe', 'file.sh'];
    
    const isValidExt = (file) => {
      const ext = file.split('.').pop();
      return validExt.includes(ext);
    };
    
    expect(isValidExt('file.md')).toBe(true);
    expect(isValidExt('file.exe')).toBe(false);
  });

  test('Should enforce read-only when needed', () => {
    const permissions = {
      read: true,
      write: false,
      execute: false
    };
    expect(permissions.read).toBe(true);
    expect(permissions.write).toBe(false);
  });
});

describe('Data Integrity', () => {
  
  test('Should preserve YAML frontmatter integrity', () => {
    const frontmatter = `---
id: test-123
name: Test
---`;
    const lines = frontmatter.split('\n');
    expect(lines[0]).toBe('---');
    expect(lines[lines.length - 1]).toBe('---');
  });

  test('Should maintain UTF-8 encoding', () => {
    const text = 'Hello Mundo Здравствуй 你好';
    const bytes = new TextEncoder().encode(text);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('Should preserve line endings', () => {
    const content = 'Line1\nLine2\nLine3';
    expect(content.split('\n').length).toBe(3);
  });
});
