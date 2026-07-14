import type { Thesaurus, ThesaurusInput } from '#shared/contracts/Thesaurus.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from '#V2/services/contracts/ServiceRequestOptions.js';
import type { ThesaurusService } from '#V2/services/contracts/ThesaurusService.js';

type TestingThesaurisServiceOptions = {
  initialThesauri?: Thesaurus[];
};

type TestingThesaurisService = ThesaurusService & {
  seed(thesauri: Thesaurus[]): void;
  snapshot(): Thesaurus[];
};

const cloneThesauri = (thesauri: Thesaurus[]): Thesaurus[] =>
  thesauri.map(thesaurus => ({
    ...thesaurus,
    values: thesaurus.values?.map(value => ({ ...value })) ?? [],
  }));

const normalizeThesaurus = (
  input: ThesaurusInput,
  id: string,
  assignValueIds: (values?: ThesaurusInput['values']) => Thesaurus['values']
): Thesaurus => ({
  _id: id,
  name: input.name,
  values: assignValueIds(input.values),
});

const createTestingThesaurisService = ({
  initialThesauri = [],
}: TestingThesaurisServiceOptions = {}): TestingThesaurisService => {
  let thesauri = cloneThesauri(initialThesauri);
  let nextId = 1;
  let nextValueId = 1;

  const assignValueIds = (values: ThesaurusInput['values'] = []): Thesaurus['values'] =>
    values.map(value => {
      nextValueId += 1;
      return {
        ...value,
        id: value.id ?? `item-${nextValueId}`,
        values: value.values ? assignValueIds(value.values) : undefined,
      };
    });

  const service: TestingThesaurisService = {
    getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<Thesaurus[]>> => [
      cloneThesauri(thesauri),
    ],

    getById: async (
      id: string,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Thesaurus | undefined>> => [
      thesauri.find(thesaurus => thesaurus._id === id),
    ],

    upsert: async (
      input: ThesaurusInput,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<Thesaurus>> => {
      nextId += 1;
      const id = input._id ?? `testing-thesaurus-${nextId}`;
      const saved = normalizeThesaurus(input, id, assignValueIds);
      const index = thesauri.findIndex(thesaurus => thesaurus._id === id);

      if (index >= 0) {
        thesauri[index] = saved;
      } else {
        thesauri.push(saved);
      }

      return [{ ...saved }];
    },

    delete: async (ids: string[], _options?: ServiceRequestOptions): Promise<ApiResponse<void>> => {
      thesauri = thesauri.filter(thesaurus => !ids.includes(thesaurus._id));
      return [undefined];
    },

    importFromFile: async (input, _file, options) => service.upsert(input, options),

    seed: (next: Thesaurus[]) => {
      thesauri = cloneThesauri(next);
    },

    snapshot: () => cloneThesauri(thesauri),
  };

  return service;
};

export { createTestingThesaurisService };
export type { TestingThesaurisService, TestingThesaurisServiceOptions };
