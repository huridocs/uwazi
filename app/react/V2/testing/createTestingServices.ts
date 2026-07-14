import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import {
  createTestingThesaurisService,
  type TestingThesaurisService,
  type TestingThesaurisServiceOptions,
} from './TestingThesaurisService.js';

type CreateTestingServicesResult = {
  services: V2Services;
  thesauri: TestingThesaurisService;
};

const createTestingServices = (
  options?: TestingThesaurisServiceOptions
): CreateTestingServicesResult => {
  const thesauri = createTestingThesaurisService(options);

  return {
    services: {
      ...httpServices,
      thesauri,
    },
    thesauri,
  };
};

export { createTestingServices };
export type { CreateTestingServicesResult };
