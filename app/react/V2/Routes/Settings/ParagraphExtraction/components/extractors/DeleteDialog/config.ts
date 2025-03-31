import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import { PXTable } from '../../../types';

const dialogConfig = {
  headerText: 'Are you sure?',
  warningText:
    'Only the extractor will be deleted, all created entities will remain on the library.',
  cancelButtonText: 'No, Cancel',
  acceptButtonText: 'Delete',
  service: extractorsAPI.remove as (ids: PXTable[]) => Promise<void>,
  successText: 'Extractor/s deleted',
  errorText: 'An error occurred',
};

export { dialogConfig };
