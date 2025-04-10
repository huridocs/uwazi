enum EntityStatus {
  New = 'new',
  Processing = 'processing',
  Obsolete = 'obsolete',
  Error = 'error',
  Processed = 'processed',
}

export type PXCreateExtractorRequest = {
  sourceRelationshipTypeId: string;
  targetRelationshipTypeId: string;
  targetTemplateId: string;
  sourceTemplateId: string;
  paragraphPropertyId: string;
  paragraphNumberPropertyId: string;
};

export type PXDeleteExtractorRequest = {
  id: string;
};

export type PXExtractRequest = {
  extractorId: string;
  entitySharedIds: string[];
};

export type PXExtractNewRequest = {
  extractorId: string;
};

export type PXGetExtractorStatusesRequest = {
  id: string;
  filter?:
    | {
        status?: EntityStatus[] | undefined;
      }
    | undefined;
  page?:
    | {
        number?: number | undefined;
        size?: number | undefined;
      }
    | undefined;
};

export type PXGetEntityParagraphsRequest = {
  extractorId: string;
  id: string;
  page?:
    | {
        number?: number | undefined;
        size?: number | undefined;
      }
    | undefined;
};
