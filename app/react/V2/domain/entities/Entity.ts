import { EntitySchema } from '../../../../shared/types/entityType';
import {
  ComposedFileData,
  ComposedNavigationData,
  ComposedRelationshipData,
  ComposedTemplate,
  EntityPermissions,
} from './types';

export interface Entity {
  readonly _id: string;
  readonly sharedId: string;
  readonly title: string;
  readonly language: string;
  readonly template?: ComposedTemplate;
  readonly creationDate?: Date;
  readonly editDate?: Date;
  readonly icon?: any;
  readonly permissions?: EntityPermissions;
  readonly metadata?: Record<string, any>;
  readonly relationships?: ComposedRelationshipData;
  readonly files?: ComposedFileData;
  readonly navigation?: ComposedNavigationData;
  readonly rawEntity?: EntitySchema;
}
