import { ResultSet } from 'api/common.v2/contracts/ResultSet';

type GetExtractorsOutput = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  count: {
    generatedEntities: number;
    new: number;
  };
};

type GetExtractorsInput = {};

interface PXExtractorsQueryService {
  getExtractors(input: GetExtractorsInput): ResultSet<GetExtractorsOutput>;
}

export type { PXExtractorsQueryService, GetExtractorsInput, GetExtractorsOutput };
