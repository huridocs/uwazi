import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { EntityStatus } from './PXEntityStatusModel';

type GetExtractorsOutput = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
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
    status: { _id: string; status: EntityStatus };
  }[];
  page: { number: number; size: number };
  totalRows: number;
};

type GetEntityParagrphRelationshipsInput = {
  id: string;
  extractorId: string;
};

type GetEntityParagraphRelationshipsOutput = {
  id: string;
  entitySharedId: string;
  hubId: string;
  relationshipTypeId: string;
};

interface PXExtractorsQueryService {
  getExtractors(): ResultSet<GetExtractorsOutput>;
  getExtractorStatuses(input: GetExtractorStatusesInput): ResultSet<GetExtractorStatusesOutput>;
  getEntityParagraphRelationships(
    input: GetEntityParagrphRelationshipsInput
  ): ResultSet<GetEntityParagraphRelationshipsOutput>;
}

export type {
  PXExtractorsQueryService,
  GetExtractorsOutput,
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  GetEntityParagrphRelationshipsInput,
  GetEntityParagraphRelationshipsOutput,
};
