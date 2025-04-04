import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';

const dialogConfig = {
  headerText: 'Are you sure?',
  warningText:
    'Only the extractor will be deleted, all created entities will remain on the library.',
  cancelButtonText: 'No, Cancel',
  acceptButtonText: 'Delete',
  service: extractorsAPI.remove,
  successText: 'Extractor/s deleted',
  errorText: 'An error occurred',
};

export { dialogConfig };
