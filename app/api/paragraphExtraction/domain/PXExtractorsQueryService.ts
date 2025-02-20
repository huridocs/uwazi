import { ResultSet } from 'api/common.v2/contracts/ResultSet';

type TemplateDTO = {
  templateId: string;
  name: string;
};

type ExtractorDTO = {
  extractorId: string;
  sourceTemplate: TemplateDTO;
  targetTemplate: TemplateDTO;
  sourceEntitiesCount: number;
};

type GetExtractorsOutput = ExtractorDTO;

type GetExtractorsInput = {};

interface PXExtractorsQueryService {
  getExtractors(input: GetExtractorsInput): ResultSet<GetExtractorsOutput>;
}

export type { ExtractorDTO, PXExtractorsQueryService, GetExtractorsInput, GetExtractorsOutput };
