import { EntitySchema } from '../../../../shared/types/entityType';
import {
  ComposedFileData,
  ComposedNavigationData,
  ComposedRelationshipData,
  ComposedTemplate,
  EntityPermissions,
  MetadataProperty,
  DateMetadataProperty,
} from './types';

export interface Entity {
  readonly _id: string;
  readonly sharedId: string;
  readonly title: string;
  readonly language: string;
  readonly template?: ComposedTemplate;
  readonly creationDate: DateMetadataProperty['values'][0];
  readonly editDate: DateMetadataProperty['values'][0];
  readonly icon?: { _id: string } | any;
  readonly permissions?: EntityPermissions;
  readonly metadata: MetadataProperty[];
  readonly relationships?: ComposedRelationshipData;
  readonly files?: ComposedFileData;
  readonly navigation?: ComposedNavigationData;
  readonly rawEntity?: EntitySchema;
}
