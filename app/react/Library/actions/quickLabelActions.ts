import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { actions } from '../../BasicReducer/index.js';
import EntitiesAPI from '../../Entities/EntitiesAPI.js';
import { IStore, QuickLabelState, QuickLabelMetadata } from '../../istore.js';
// @ts-expect-error TS(2307): Cannot find module '../../Notifications.js' or its... Remove this comment to see the full error message
import { notificationActions } from '../../Notifications.js';
import { RequestParams } from '../../utils/RequestParams.js';
import { t } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/commonTopicClassi... Remove this comment to see the full error message
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification.js';

import { MetadataObjectSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
import { updateEntities } from './libraryActions';

function toggleQuickLabelAutoSave() {
  return (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const opts = getState().library.sidepanel.quickLabelState.toJS();
    dispatch(
      actions.set('library.sidepanel.quickLabelState', {
        ...opts,
        autoSave: !opts.autoSave,
      } as QuickLabelState)
    );
  };
}

function buildQuickLabelMetadata(docs: EntitySchema[], propNames: string[]): QuickLabelMetadata {
  const counts: { [k: string]: { [k: string]: number } } = propNames.reduce(
    (res, p) => ({ ...res, [p]: {} }),
    {}
  );
  docs.forEach(d =>
    propNames.forEach(p => {
      if (!d.metadata || !d.metadata[p]) {
        return;
      }
      if (!counts[p]) {
        counts[p] = {};
      }
      // @ts-expect-error TS(7006): Parameter 'mo' implicitly has an 'any' type.
      d.metadata[p]!.forEach(mo => {
        if (!mo.value) {
          return;
        }
        if (!counts[p][mo.value as string]) {
          counts[p][mo.value as string] = 1;
        } else {
          counts[p][mo.value as string] += 1;
        }
      });
    })
  );
  return propNames.reduce(
    (res, p) => ({
      ...res,
      [p]: {
        added: [],
        removed: [],
        originalFull: Object.keys(counts[p]).filter(k => counts[p][k] === docs.length),
        originalPartial: Object.keys(counts[p]).filter(k => counts[p][k] < docs.length),
      },
    }),
    {}
  );
}

function selectedDocumentsChanged() {
  return (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const model = 'library.sidepanel.quickLabelMetadata';
    const state = getState();
    if (!state.library?.sidepanel?.quickLabelState?.get('thesaurus')) {
      return;
    }
    dispatch(formActions.reset(model));
    const sharedIds = state.library.ui
      .get('selectedDocuments')
      // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
      .map(d => d!.get('sharedId'))
      .toJS();
    const docs: EntitySchema[] = state.library.documents
      .get('rows')
      // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
      .filter(d => sharedIds.includes(d!.get('sharedId')))
      .toJS();
    if (!docs.length) {
      return;
    }
    const templateIds = docs.map(d => d.template).filter(v => v);
    const templates = state.templates
      // @ts-expect-error TS(7006): Parameter 'template' implicitly has an 'any' type.
      .filter(template => templateIds.includes(template!.get('_id')))
      .toJS();
    const propNames = getThesaurusPropertyNames(
      state.library.sidepanel.quickLabelState.get('thesaurus')!,
      templates
    );
    const newState = buildQuickLabelMetadata(docs, propNames);
    dispatch(formActions.load(model, newState));
    dispatch(formActions.setPristine(model));
  };
}

function maybeSaveQuickLabels(force?: boolean) {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const state = getState();
    if (!force && !state.library?.sidepanel?.quickLabelState?.get('autoSave')) {
      return;
    }
    const current = state.library.sidepanel.quickLabelMetadata;
    const diffs: {
      [k: string]: { added: MetadataObjectSchema[]; removed: MetadataObjectSchema[] };
    } = {};
    Object.keys(current).forEach(p => {
      if (current[p] && current[p].added.length + current[p].removed.length > 0) {
        diffs[p] = {
          added: current[p].added.map(v => ({ value: v })),
          removed: current[p].removed.map(v => ({ value: v })),
        };
      }
    });
    if (!diffs || !Object.keys(diffs).length) {
      return;
    }
    const ids = state.library.ui
      .get('selectedDocuments')
      // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
      .map(entity => entity!.get('sharedId'))
      .toJS();
    const updatedDocs = await EntitiesAPI.multipleUpdate(
      new RequestParams({ ids, values: { diffMetadata: diffs } })
    );
    dispatch(notificationActions.notify(t('System', 'Update success', null, false), 'success'));
    dispatch(updateEntities(updatedDocs));
    dispatch(selectedDocumentsChanged());
  };
}

export { selectedDocumentsChanged, maybeSaveQuickLabels, toggleQuickLabelAutoSave };
