import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';

export const PX_EXTRACTORS_PER_PAGE = 10;
export const PX_ENTITIES_PER_PAGE = 10;

export const pxActions = {
  deleteExtractor: {
    header: 'Are you sure?',
    warningText:
      'Only the extractor will be deleted, all created entities will remain on the library.',
    cancelButtonText: 'No, Cancel',
    acceptButtonText: 'Delete',
    service: extractorsAPI.remove as unknown as (params: any) => Promise<void>,
    successText: 'Extractor/s deleted',
    errorText: 'An error occurred',
  },
  deleteExtractors: {
    header: 'Are you sure?',
    warningText: 'All of the paragraphs will be deleted!',
    cancelButtonText: 'No, Cancel',
    acceptButtonText: 'Delete',
    service: extractorsAPI.remove as unknown as (params: any) => Promise<void>,
    successText: 'Extractor/s deleted',
    errorText: 'An error occurred',
  },
  extractParagraphs: {
    header: 'Are you sure?',
    cancelButtonText: 'No, Cancel',
    acceptButtonText: 'Continue',
    service: extractorsAPI.save as unknown as (params: any) => Promise<void>,
    warningText:
      'All of the previously created paragraphs will be deleted and recreated after the process.',
    successText: 'Paragraphs extracted',
    errorText: 'An error occurred',
  },
};

export const PX_LINK_TEMPLATE_CRITERIA =
  'https://uwazi.readthedocs.io/en/latest/admin-docs/paragraph-extraction.html';

export const defaultEntityQuery = {
  filter: {
    extractorId: '',
    status: [],
    languages: [],
  },
  page: {
    number: 1,
    size: PX_ENTITIES_PER_PAGE,
  },
  sort: {
    property: '',
    order: 'desc' as const,
  },
};
