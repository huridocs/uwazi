import type { Template, TemplateInput } from '#shared/contracts/Template.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from '#V2/services/contracts/ServiceRequestOptions.js';
import type { TemplatesService } from '#V2/services/contracts/TemplatesService.js';

type TestingTemplatesServiceOptions = {
  initialTemplates?: Template[];
  initialEntityCounts?: Record<string, number>;
};

type TestingTemplatesService = TemplatesService & {
  seed(templates: Template[]): void;
  seedEntityCounts(counts: Record<string, number>): void;
  snapshot(): Template[];
};

const cloneTemplates = (templates: Template[]): Template[] =>
  templates.map(template => ({
    ...template,
    properties: template.properties?.map(property => ({ ...property })),
    commonProperties: template.commonProperties?.map(property => ({ ...property })),
    processing: template.processing ? { ...template.processing } : undefined,
  }));

const createTestingTemplatesService = ({
  initialTemplates = [],
  initialEntityCounts = {},
}: TestingTemplatesServiceOptions = {}): TestingTemplatesService => {
  let templates = cloneTemplates(initialTemplates);
  let entityCounts = { ...initialEntityCounts };
  let nextId = 1;

  const service: TestingTemplatesService = {
    getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<Template[]>> => [
      cloneTemplates(templates),
    ],

    getById: async (
      id: string,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Template | undefined>> => [
      cloneTemplates(templates).find(template => template._id === id),
    ],

    checkEntityCounts: async (
      templateIds: string[],
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Record<string, number>>> => [
      templateIds.reduce<Record<string, number>>((acc, id) => {
        acc[id] = entityCounts[id] ?? 0;
        return acc;
      }, {}),
    ],

    upsert: async (
      input: TemplateInput,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Template>> => {
      nextId += 1;
      const id = input._id ?? `testing-template-${nextId}`;
      const { reindex: _reindex, ...rest } = input;
      const saved: Template = {
        ...rest,
        _id: id,
        name: input.name,
      };
      const index = templates.findIndex(template => template._id === id);

      if (index >= 0) {
        templates[index] = saved;
      } else {
        templates.push(saved);
      }

      return [{ ...saved }];
    },

    delete: async (ids: string[], _options?: ServiceRequestOptions): Promise<ApiResponse<void>> => {
      templates = templates.filter(template => !ids.includes(template._id));
      return [undefined];
    },

    setDefault: async (
      id: string,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Template>> => {
      templates = templates.map(template => ({
        ...template,
        default: template._id === id,
      }));
      const updated = templates.find(template => template._id === id);
      if (!updated) {
        return [undefined as never];
      }
      return [{ ...updated }];
    },

    seed: (next: Template[]) => {
      templates = cloneTemplates(next);
    },

    seedEntityCounts: (counts: Record<string, number>) => {
      entityCounts = { ...counts };
    },

    snapshot: () => cloneTemplates(templates),
  };

  return service;
};

export { createTestingTemplatesService };
export type { TestingTemplatesService, TestingTemplatesServiceOptions };
