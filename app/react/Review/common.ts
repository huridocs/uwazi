/** @format */

import { EntitySchema } from 'shared/types/entityType';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

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

export const selectEntity = createSelector(
  (state: StoreState) => state.entityView.entity,
  entity => entity.toJS()
);

export const selectOneUpState = createSelector(
  (state: StoreState) => state.oneUpReview.state,
  state => state?.toJS()
);

export const selectMlThesauri = createSelector(
  (state: StoreState) => state.thesauris,
  thesauri =>
    thesauri
      .filter(thes => !!thes.get('enable_classification'))
      .map(thes => thes.get('_id')?.toString() ?? '')
      .toJS()
);

export const selectIsPristine = createSelector(
  (state: StoreState) => state.entityView.entityFormState.$form.pristine,
  value => value
);
