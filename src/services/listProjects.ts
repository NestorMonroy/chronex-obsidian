export interface ListOptions {
  priority?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}

export interface ListResult {
  items: any[];
  total: number;
  limit: number;
  offset: number;
}

export class ListService {
  static async listProjects(options: ListOptions = {}): Promise<ListResult | any[]> {
    const items: any[] = [];
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    if (options.limit !== undefined) {
      return {
        items,
        total: 0,
        limit,
        offset
      };
    }

    return items;
  }
}

export const listService = {
  listProjects: (options?: ListOptions) => ListService.listProjects(options)
};
