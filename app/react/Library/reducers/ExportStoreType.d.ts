import { IImmutable } from 'shared/types/Immutable';

export interface ExportStore {
  exportSearchResults: {
    exportSearchResultsProcessing: IImmutable<boolean>;
    exportSearchResultsContent: IImmutable<string>;
    exportSearchResultsFileName: IImmutable<string>;
  };
}
