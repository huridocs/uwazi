import { LanguagesListSchema } from 'shared/types/commonTypes';

interface PXEntityStatusesQueryService {
  fetchUnprocessedEntities(params: {
    sourceTemplateId: string;
    extractorId: string;
    defaultLanguageKey: string;
    installedLanguages: LanguagesListSchema;
    batchSize: number;
  }): Promise<{ sharedId: string }[]>;
}

export type { PXEntityStatusesQueryService };
