import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntityStatus } from './PXEntityStatusModel';

type GetExtractorEntitiesOutput = {
  rows: {
    sharedId: string;
    availableLanguages: LanguageISO6391[];
    paragraphsCount: number;
    status: EntityStatus;
  }[];
  page: number;
  size: number;
  totalRows: number;
};

type GetExtractorEntitiesInput = {
  id: string;
  language: LanguageISO6391;
  page?: { number?: number; size?: number };
  filter?: {
    status?: EntityStatus;
  };
};

interface PXExtractorEntitiesQueryService {
  getExtractorEntities(input: GetExtractorEntitiesInput): Promise<GetExtractorEntitiesOutput>;
}

export type {
  PXExtractorEntitiesQueryService,
  GetExtractorEntitiesInput,
  GetExtractorEntitiesOutput,
};
