import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ResultSet } from 'api/core/libs/ResultSet';
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';

import { EntityStatus } from './PXEntityStatusModel';
import { EntityStatusDTO } from '../types';

type GetExtractorsOutput = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  paragraphNumberPropertyId: string;
  paragraphPropertyId: string;
  statusCount: {
    new: number;
    processing: number;
    obsolete: number;
    error: number;
    processed: number;
  };
};

type GetExtractorStatusesInput = {
  id: string;
  language: LanguageISO6391;
  page?: { number?: number; size?: number };
  filter?: {
    status?: EntityStatus[];
  };
};

type GetExtractorStatusesOutput = {
  rows: {
    entity: { _id: string; sharedId: string; title: string; language: LanguageISO6391 };
    status: { _id: string; status: EntityStatusDTO };
  }[];
  page: { number: number; size: number };
  totalRows: number;
};

type GetEntityParagraphRelationshipsInput = {
  id: string;
  extractorId: string;
  options?: { requireEntityStatus?: boolean };
};

type GetEntityParagraphRelationshipsOutput = {
  id: string;
  entitySharedId: string;
  hubId: string;
  relationshipTypeId: string;
};

type GetExtractedParagraphsInput = {
  ids: string[];
  paragraphNumberProperty: string;
  mainLanguage: LanguageISO6391;
  page?: { number?: number; size?: number };
};

type GetExtractedParagraphsOutput = {
  rows: { sharedId: string; entities: EntityDBO[] }[];
  page: { number: number; size: number };
  totalRows: number;
};

interface PXExtractorsQueryService {
  getExtractors(): ResultSet<GetExtractorsOutput>;
  getExtractorStatuses(input: GetExtractorStatusesInput): ResultSet<GetExtractorStatusesOutput>;
  getEntityParagraphRelationships(
    input: GetEntityParagraphRelationshipsInput
  ): ResultSet<GetEntityParagraphRelationshipsOutput>;
  getExtractedParagraphs(
    input: GetExtractedParagraphsInput
  ): ResultSet<GetExtractedParagraphsOutput>;
}

export type {
  PXExtractorsQueryService,
  GetExtractorsOutput,
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  GetEntityParagraphRelationshipsInput,
  GetEntityParagraphRelationshipsOutput,
  GetExtractedParagraphsInput,
  GetExtractedParagraphsOutput,
};
