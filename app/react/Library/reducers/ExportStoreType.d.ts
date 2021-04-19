import { IImmutable } from 'shared/types/Immutable';

export interface ExportStore {
  user: IImmutable<object>;
  exportSearchResults: {
    exportSearchResultsProcessing: IImmutable<boolean>;
    exportSearchResultsContent: IImmutable<string>;
    exportSearchResultsFileName: IImmutable<string>;
  };
}
