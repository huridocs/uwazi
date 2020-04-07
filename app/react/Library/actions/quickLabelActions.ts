import { actions } from 'app/BasicReducer';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { IStore, QuickLabelState, QuickLabelMetadata } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';
import { Dispatch } from 'redux';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { updateEntities } from './libraryActions';

export function toggleQuickLabelAutoSave() {
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

export function selectedDocumentsChanged() {
  return (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const model = 'library.sidepanel.quickLabelMetadata';
    const state = getState();
    if (!state.library?.sidepanel?.quickLabelState?.get('thesaurus')) {
      return;
    }
    dispatch(formActions.reset(model));
    const sharedIds = state.library.ui
      .get('selectedDocuments')
      .map(d => d!.get('sharedId'))
      .toJS();
    const docs: EntitySchema[] = state.library.documents
      .get('rows')
      .filter(d => sharedIds.includes(d!.get('sharedId')))
      .toJS();
    if (!docs.length) {
      return;
    }
    const templateIds = docs.map(d => d.template).filter(v => v);
    const templates = state.templates.filter(t => templateIds.includes(t!.get('_id'))).toJS();
    const propNames = getThesaurusPropertyNames(
      state.library.sidepanel.quickLabelState.get('thesaurus')!,
      templates
    );
    const newState = buildQuickLabelMetadata(docs, propNames);
    dispatch(formActions.load(model, newState));
    dispatch(formActions.setPristine(model));
  };
}

export function maybeSaveQuickLabels(force?: boolean) {
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
      .map(entity => entity!.get('sharedId'))
      .toJS();
    const updatedDocs = await EntitiesAPI.multipleUpdate(
      new RequestParams({ ids, values: { diffMetadata: diffs } })
    );
    dispatch(notificationActions.notify('Update success', 'success'));
    dispatch(updateEntities(updatedDocs));
    dispatch(selectedDocumentsChanged());
  };
}
