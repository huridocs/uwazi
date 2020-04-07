import { IImmutable } from 'shared/types/Immutable';

export interface ExportStore {
  exportSearchResults: {
    exportSearchResultsProcessing: IImmutable<boolean>;
    exportSearchResultsContent: IImmutable<string>;
    exportSearchResultFileName: IImmutable<string>;
    exportSearchResultError: IImmutable<any>;
  };
}
