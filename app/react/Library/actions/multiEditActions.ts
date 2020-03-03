import { EntitySchema } from 'api/entities/entityType';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { notificationActions } from 'app/Notifications';
import { actions as formActions } from 'react-redux-form';
import { Dispatch } from 'redux';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { RequestParams } from '../../utils/RequestParams';
import { updateEntities } from './libraryActions';
import { actions } from 'app/BasicReducer';

export interface MultiEditOpts {
  thesaurus?: string;
  autoSave?: boolean;
}

export interface TriStateSelectValue {
  // Thesaurus value ids that should be added to all entities.
  added: string[];
  // Thesaurus value ids that should be removed from all entities.
  removed: string[];
  // Thesaurus value ids that all entities originally had.
  originalFull: string[];
  // Thesaurus value ids that some, but not all, entities originally had.
  originalPartial: string[];
}

export interface MultiEditState {
  [k: string]: TriStateSelectValue;
}

export interface StoreState {
  library: {
    documents: IImmutable<{ rows: EntitySchema[] }>;
    ui: IImmutable<{
      selectedDocuments: EntitySchema[];
    }>;
    sidepanel: {
      multiEditOpts: IImmutable<MultiEditOpts>;
      multipleEdit: MultiEditState;
      multipleEditForm: any;
    };
  };
  templates: IImmutable<TemplateSchema[]>;
  thesauris: IImmutable<ThesaurusSchema[]>;
}

export function toggleAutoSaveMode() {
  return (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const opts = getState().library.sidepanel.multiEditOpts.toJS();
    dispatch(
      actions.set('library.sidepanel.multiEditOpts', {
        ...opts,
        autoSave: !opts.autoSave,
      } as MultiEditOpts)
    );
  };
}

function buildMultipleEditState(docs: EntitySchema[], propNames: string[]): MultiEditState {
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
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const model = 'library.sidepanel.multipleEdit';
    const state = getState();
    if (!state.library.sidepanel.multiEditOpts.get('thesaurus')) {
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
      state.library.sidepanel.multiEditOpts.get('thesaurus')!,
      templates
    );
    const newState = buildMultipleEditState(docs, propNames);
    dispatch(formActions.load(model, newState));
    dispatch(formActions.setPristine(model));
  };
}

export function maybeSaveMultiEdit() {
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const state = getState();
    if (!state.library.sidepanel.multiEditOpts.get('autoSave')) {
      return;
    }
    const current = state.library.sidepanel.multipleEdit;
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
    await dispatch(selectedDocumentsChanged());
  };
}
