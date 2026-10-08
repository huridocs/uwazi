import type { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';

type TemplatesReader = {
  get(): Promise<{ _id: { toString(): string } }[]>;
};

type Deps = {
  entitiesDAO: EntitiesDAO;
  templatesDAO: TemplatesReader;
};

type CountOneByTemplateInput = {
  templateId: string;
};

type EntityCountByTemplateQuery = {
  all(): Promise<Record<string, number>>;
  one(input: CountOneByTemplateInput): Promise<number>;
};

class EntityCountByTemplateQueryService implements EntityCountByTemplateQuery {
  constructor(private deps: Deps) {}

  async all(): Promise<Record<string, number>> {
    const templates = await this.deps.templatesDAO.get();
    const entries = await Promise.all(
      templates.map(async (template): Promise<[string, number]> => {
        const templateId = template._id.toString();
        return [templateId, await this.deps.entitiesDAO.countByTemplate(templateId)];
      })
    );
    return Object.fromEntries(entries);
  }

  async one({ templateId }: CountOneByTemplateInput): Promise<number> {
    return this.deps.entitiesDAO.countByTemplate(templateId);
  }
}

export { EntityCountByTemplateQueryService };
export type { EntityCountByTemplateQuery };
