import * as entitiesAPI from 'app/V2/api/paragraphExtractor/entities';

const dialogConfig = {
  headerText: 'Are you sure?',
  cancelButtonText: 'No, Cancel',
  acceptButtonText: 'Continue',
  service: entitiesAPI.extractNewParagraphs,
  warningText:
    'All of the previously created paragraphs will be deleted and recreated after the process.',
  successText: 'Paragraphs extracted',
  errorText: 'An error occurred',
};

export { dialogConfig };
