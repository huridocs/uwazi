import { ResultSet } from 'api/common.v2/contracts/ResultSet';

type TemplateDTO = {
  templateId: string;
  name: string;
};

type GetExtractorsOutput = {
  extractorId: string;
  sourceTemplate: TemplateDTO;
  targetTemplate: TemplateDTO;
  paragraphsQuantity: number;
};

type GetExtractorsInput = {};

interface PXExtractorsQueryService {
  getExtractors(input: GetExtractorsInput): ResultSet<GetExtractorsOutput>;
}

export type { PXExtractorsQueryService, GetExtractorsInput, GetExtractorsOutput };
