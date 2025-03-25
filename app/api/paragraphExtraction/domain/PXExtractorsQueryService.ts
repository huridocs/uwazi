import { ResultSet } from 'api/common.v2/contracts/ResultSet';

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

type GetExtractorsInput = {};

interface PXExtractorsQueryService {
  getExtractors(input: GetExtractorsInput): ResultSet<GetExtractorsOutput>;
}

export type { PXExtractorsQueryService, GetExtractorsInput, GetExtractorsOutput };
