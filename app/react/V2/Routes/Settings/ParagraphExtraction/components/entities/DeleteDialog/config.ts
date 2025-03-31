import * as entitiesAPI from 'app/V2/api/paragraphExtractor/entities';

const dialogConfig = {
  headerText: 'Are you sure?',
  warningText: 'All of the paragraphs will be deleted!',
  cancelButtonText: 'No, Cancel',
  acceptButtonText: 'Delete',
  service: entitiesAPI.remove as unknown as (params: any) => Promise<void>,
  successText: 'Paragraphs deleted',
  errorText: 'An error occurred',
};

export { dialogConfig };
