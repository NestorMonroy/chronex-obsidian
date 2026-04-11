/**
 * Tests para UC-SYS01: Validar Entrada de Usuario
 */

import { Validator, ValidationRule, validate } from '../src/utils/validators';

describe('UC-SYS01: Validator', () => {
  describe('validateName', () => {
    it('debe aceptar nombres válidos', () => {
      const validNames = [
        'Mi Proyecto',
        'Proyecto-2026',
        'Objetivo (Beta)',
        'Tarea 1',
        'Dokumentación áéíóú'
      ];

      validNames.forEach(name => {
        const result = Validator.validateName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('debe rechazar nombres vacíos o nulos', () => {
      const result1 = Validator.validateName('');
      const result2 = Validator.validateName(null);
      const result3 = Validator.validateName(undefined);

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(false);
    });

    it('debe rechazar nombres muy cortos', () => {
      const result = Validator.validateName('AB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('al menos');
    });

    it('debe rechazar nombres muy largos', () => {
      const longName = 'x'.repeat(151);
      const result = Validator.validateName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceder');
    });

    it('debe rechazar caracteres especiales no permitidos', () => {
      const invalidNames = [
        'Proyecto@#$',
        'Tarea!*&',
        'Objetivo~`',
        'Nombre%'
      ];

      invalidNames.forEach(name => {
        const result = Validator.validateName(name);
        expect(result.valid).toBe(false);
      });
    });

    it('debe trimear espacios', () => {
      const result = Validator.validateName('  Mi Proyecto  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Mi Proyecto');
    });
  });

  describe('validateDescription', () => {
    it('debe aceptar descripciones válidas', () => {
      const result = Validator.validateDescription('Una descripción válida');
      expect(result.valid).toBe(true);
    });

    it('debe aceptar descripción vacía (es opcional)', () => {
      const result1 = Validator.validateDescription('');
      const result2 = Validator.validateDescription(null);
      const result3 = Validator.validateDescription(undefined);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(true);
    });

    it('debe rechazar descripción muy larga', () => {
      const longDescription = 'x'.repeat(1001);
      const result = Validator.validateDescription(longDescription);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1000');
    });
  });

  describe('validateIdFormat', () => {
    it('debe aceptar formato correcto', () => {
      const validIds = [
        'PROJ-202604-A1B2C',
        'DOC-202604-ABC12',
        'OBJ-202604-XYZ99',
        'TSK-202604-00000'
      ];

      validIds.forEach(id => {
        const result = Validator.validateIdFormat(id);
        expect(result.valid).toBe(true);
      });
    });

    it('debe rechazar formatos inválidos', () => {
      const invalidIds = [
        'invalid',
        'PROJ-2026-ABC',
        'PROJ-202604-ABC',
        'proj-202604-A1B2C',
        'PROJ-202604-abc12',
        '',
        'PROJ-202604'
      ];

      invalidIds.forEach(id => {
        const result = Validator.validateIdFormat(id);
        expect(result.valid).toBe(false);
      });
    });

    it('debe rechazar ID nulo/vacío', () => {
      const result1 = Validator.validateIdFormat(null);
      const result2 = Validator.validateIdFormat(undefined);

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('debe aceptar rango de fechas válido', () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');

      const result = Validator.validateDateRange(from, to);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveProperty('from');
      expect(result.value).toHaveProperty('to');
    });

    it('debe aceptar strings de fecha válidos', () => {
      const result = Validator.validateDateRange('2026-01-01', '2026-12-31');
      expect(result.valid).toBe(true);
    });

    it('debe rechazar si from > to', () => {
      const from = new Date('2026-12-31');
      const to = new Date('2026-01-01');

      const result = Validator.validateDateRange(from, to);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('posterior');
    });

    it('debe rechazar fechas inválidas', () => {
      const result = Validator.validateDateRange('invalid', 'date');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDaysRange', () => {
    it('debe aceptar rango de días válido', () => {
      const validDays = [1, 7, 30, 90, 365];

      validDays.forEach(days => {
        const result = Validator.validateDaysRange(days);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(days);
      });
    });

    it('debe aceptar string de número válido', () => {
      const result = Validator.validateDaysRange('30');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(30);
    });

    it('debe rechazar días < 1', () => {
      const result = Validator.validateDaysRange(0);
      expect(result.valid).toBe(false);
    });

    it('debe rechazar días > 365', () => {
      const result = Validator.validateDaysRange(366);
      expect(result.valid).toBe(false);
    });

    it('debe rechazar valor no numérico', () => {
      const result = Validator.validateDaysRange('abc');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePriority', () => {
    it('debe aceptar prioridades válidas', () => {
      const validPriorities = ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'];

      validPriorities.forEach(priority => {
        const result = Validator.validatePriority(priority);
        expect(result.valid).toBe(true);
      });
    });

    it('debe aceptar minúsculas y convertir', () => {
      const result = Validator.validatePriority('baja');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('BAJA');
    });

    it('debe rechazar prioridades inválidas', () => {
      const result = Validator.validatePriority('URGENTE');
      expect(result.valid).toBe(false);
    });

    it('debe rechazar nulo/vacío', () => {
      const result = Validator.validatePriority(null);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateStatus', () => {
    it('debe validar estados de proyecto', () => {
      const validStatuses = ['pendiente', 'activo', 'pausado', 'completado', 'archivado'];

      validStatuses.forEach(status => {
        const result = Validator.validateStatus(status, 'proyecto');
        expect(result.valid).toBe(true);
      });
    });

    it('debe validar estados de objetivo', () => {
      const validStatuses = ['pendiente', 'activo', 'completado', 'archivado'];

      validStatuses.forEach(status => {
        const result = Validator.validateStatus(status, 'objetivo');
        expect(result.valid).toBe(true);
      });
    });

    it('debe validar estados de tarea', () => {
      const validStatuses = ['pendiente', 'en_progreso', 'bloqueada', 'completada', 'archivada'];

      validStatuses.forEach(status => {
        const result = Validator.validateStatus(status, 'tarea');
        expect(result.valid).toBe(true);
      });
    });

    it('debe rechazar estado no válido para tipo', () => {
      // 'en_progreso' no es válido para proyecto
      const result = Validator.validateStatus('en_progreso', 'proyecto');
      expect(result.valid).toBe(false);
    });

    it('debe ser case-insensitive', () => {
      const result = Validator.validateStatus('ACTIVO', 'proyecto');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('activo');
    });
  });

  describe('validateEmail', () => {
    it('debe aceptar emails válidos', () => {
      const validEmails = [
        'user@example.com',
        'name.surname@domain.co.uk',
        'test+tag@example.com'
      ];

      validEmails.forEach(email => {
        const result = Validator.validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('debe rechazar emails inválidos', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com'
      ];

      invalidEmails.forEach(email => {
        const result = Validator.validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });

    it('debe aceptar email vacío (es opcional)', () => {
      const result = Validator.validateEmail('');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('debe aceptar URLs válidas', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com/path',
        'https://example.com?query=value'
      ];

      validUrls.forEach(url => {
        const result = Validator.validateUrl(url);
        expect(result.valid).toBe(true);
      });
    });

    it('debe rechazar URLs sin protocolo', () => {
      const result = Validator.validateUrl('example.com');
      expect(result.valid).toBe(false);
    });

    it('debe aceptar URL vacía (es opcional)', () => {
      const result = Validator.validateUrl('');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('debe validar múltiples campos correctamente', () => {
      const data = {
        nombre: 'Mi Proyecto',
        descripcion: 'Una buena descripción',
        prioridad: 'ALTA',
        dias: 30
      };

      const rules = {
        nombre: { type: ValidationRule.NAME },
        descripcion: { type: ValidationRule.DESCRIPTION },
        prioridad: { type: ValidationRule.PRIORITY },
        dias: { type: ValidationRule.DAYS_RANGE }
      };

      const result = Validator.validateAll(data, rules);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.validatedData).toBeDefined();
    });

    it('debe retornar errores para campos inválidos', () => {
      const data = {
        nombre: '',
        descripcion: 'OK',
        prioridad: 'INVÁLIDA',
        dias: 1000
      };

      const rules = {
        nombre: { type: ValidationRule.NAME },
        descripcion: { type: ValidationRule.DESCRIPTION },
        prioridad: { type: ValidationRule.PRIORITY },
        dias: { type: ValidationRule.DAYS_RANGE }
      };

      const result = Validator.validateAll(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors['nombre']).toBeDefined();
      expect(result.errors['prioridad']).toBeDefined();
      expect(result.errors['dias']).toBeDefined();
      expect(result.validatedData).toBeUndefined();
    });

    it('debe validar status con entityType', () => {
      const data = {
        status: 'en_progreso'
      };

      const rules = {
        status: { type: ValidationRule.STATUS, entityType: 'proyecto' }
      };

      const result = Validator.validateAll(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors['status']).toBeDefined();
    });
  });

  describe('validateRequired', () => {
    it('debe aceptar valores no vacíos', () => {
      const result = Validator.validateRequired('valor');
      expect(result.valid).toBe(true);
    });

    it('debe rechazar valores vacíos', () => {
      const results = [
        Validator.validateRequired(null),
        Validator.validateRequired(undefined),
        Validator.validateRequired('')
      ];

      results.forEach(result => {
        expect(result.valid).toBe(false);
      });
    });

    it('debe incluir nombre del campo en el error', () => {
      const result = Validator.validateRequired('', 'Nombre');
      expect(result.error).toContain('Nombre');
    });
  });

  describe('validateEnum', () => {
    it('debe aceptar valores permitidos', () => {
      const result = Validator.validateEnum('rojo', ['rojo', 'verde', 'azul']);
      expect(result.valid).toBe(true);
    });

    it('debe rechazar valores no permitidos', () => {
      const result = Validator.validateEnum('amarillo', ['rojo', 'verde', 'azul']);
      expect(result.valid).toBe(false);
    });

    it('debe incluir opciones permitidas en el error', () => {
      const result = Validator.validateEnum('amarillo', ['rojo', 'verde']);
      expect(result.error).toContain('rojo');
      expect(result.error).toContain('verde');
    });
  });

  describe('Alias functions (validate)', () => {
    it('debe funcionar como atajo', () => {
      const result1 = validate.name('Mi Proyecto');
      const result2 = Validator.validateName('Mi Proyecto');

      expect(result1.valid).toBe(result2.valid);
    });

    it('debe soportar validate.all', () => {
      const result = validate.all(
        { nombre: 'Proyecto' },
        { nombre: { type: 'name' } }
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('debe manejar valores muy largos', () => {
      const longValue = 'x'.repeat(10000);
      const result = Validator.validateDescription(longValue);
      expect(result.valid).toBe(false);
    });

    it('debe ser case-insensitive donde sea apropiado', () => {
      const result = Validator.validatePriority('alta');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('ALTA');
    });

    it('debe manejar caracteres especiales permitidos', () => {
      const result = Validator.validateName('Proyecto-2026 (Beta) áéíóú');
      expect(result.valid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('debe validar rápidamente', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        Validator.validateName('Mi Proyecto');
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
    });
  });
});
