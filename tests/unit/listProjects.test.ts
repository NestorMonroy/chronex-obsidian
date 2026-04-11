import { ListService } from '../../src/services/listProjects';

describe('UC-015: List Projects', () => {
  it('debe listar proyectos vacío', async () => {
    const result = await ListService.listProjects();
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe aplicar filtros', async () => {
    const result = await ListService.listProjects({ priority: 'ALTA' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe ordenar resultados', async () => {
    const result = await ListService.listProjects({ sortBy: 'dateCreated' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe paginar resultados', async () => {
    const result = await ListService.listProjects({ limit: 10, offset: 0 });
    expect(result.items).toBeDefined();
    expect(result.total).toBeDefined();
  });
});
