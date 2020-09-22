import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';

export interface CollectionViewerProps {
  rowListZoomLevel: number;
  documents: IImmutable<{ rows: EntitySchema[] }>;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (e: React.SyntheticEvent, doc: EntitySchema, active: boolean) => any;
  onSnippetClick: () => void;
  deleteConnection: (connection: any) => void;
  loadNextGroupOfEntities: () => void;
}
