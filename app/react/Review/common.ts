/** @format */

import { IImmutable } from 'shared/interfaces/Immutable.interface';
import { EntitySchema } from 'api/entities/entityType';
import { TemplateSchema } from 'api/templates/templateType';
import { ThesaurusSchema } from 'api/thesauris/dictionariesType';

export interface OneUpState {
  loaded: boolean;
  fullEdit: boolean;
  loadConnections: boolean;
  indexInDocs: number;
  totalDocs: number;
  maxTotalDocs: number;
  requestHeaders: Object;
  reviewThesaurusName: string | null;
  reviewThesaurusId: string | null;
  reviewThesaurusValues: string[];
}

export interface StoreState {
  relationships: any;
  entityView: {
    entity: IImmutable<EntitySchema>;
    entityFormState: any;
    entityForm: any;
    uiState: IImmutable<{ tab: string }>;
  };
  oneUpReview: {
    state?: IImmutable<OneUpState>;
  };
  templates: IImmutable<TemplateSchema[]>;
  thesauris: IImmutable<ThesaurusSchema[]>;
  library: {
    documents: IImmutable<{ rows: EntitySchema[] }>;
  };
}
