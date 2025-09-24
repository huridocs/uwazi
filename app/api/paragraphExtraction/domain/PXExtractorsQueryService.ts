
import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/schema... Remove this comment to see the full error message
import { EntityDBO } from '../entities.v2/database/schemas/EntityTypes.js';

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
