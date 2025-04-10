export type PXCreateExtractorRequest = {
  sourceRelationshipTypeId: string;
  targetRelationshipTypeId: string;
  targetTemplateId: string;
  sourceTemplateId: string;
  paragraphPropertyId: string;
  paragraphNumberPropertyId: string;
};

export type PXExtractRequest = {
  extractorId: string;
  entitySharedIds: string[];
};
