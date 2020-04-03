import { createSelector } from 'reselect';
import { IStore } from 'app/istore';

export const selectEntity = createSelector(
  (state: IStore) => state.entityView.entity,
  entity => entity?.toJS()
);

export const selectOneUpState = createSelector(
  (state: IStore) => state.oneUpReview.state,
  state => state?.toJS()
);

export const selectMlThesauri = createSelector(
  (state: IStore) => state.thesauris,
  thesauri =>
    thesauri
      .filter(thes => !!thes!.get('enable_classification'))
      .map(thes => thes!.get('_id')?.toString() ?? '')
      .toJS() as string[]
);

export const selectIsPristine = createSelector(
  (state: IStore) => state.entityView.entityFormState.$form.pristine,
  value => value
);
