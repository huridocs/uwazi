import { EntitySchema } from 'api/entities/entityType';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { notificationActions } from 'app/Notifications';
import { actions as formActions } from 'react-redux-form';
import { Dispatch } from 'redux';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { RequestParams } from '../../utils/RequestParams';
import { updateEntities } from './libraryActions';

export interface MultiEditOpts {
  thesaurus?: string;
  autoSave?: boolean;
}

export interface MultiEditState {
  [k: string]: {
    // Thesaurus value ids that should be added to all entities.
    added: string[];
    // Thesaurus value ids that should be removed from all entities.
    removed: string[];
    // Thesaurus value ids that all entities originally had.
    originalFull?: string[];
    // Thesaurus value ids that some, but not all, entities originally had.
    originalPartial?: string[];
  };
}

export interface StoreState {
  library: {
    ui: IImmutable<{
      selectedDocuments: EntitySchema[];
    }>;
    sidepanel: {
      multiEditOpts: IImmutable<MultiEditOpts>;
      multipleEdit: MultiEditState;
    };
  };
  templates: IImmutable<TemplateSchema[]>;
}

function mergedSelectedDocuments(
  state: StoreState,
  addedDocs?: EntitySchema[] | null,
  removedDocIds?: string[]
) {
  if (addedDocs === null) {
    return [];
  }
  const afterRemove = state.library.ui
    .get('selectedDocuments')
    .filter(d => !(removedDocIds || []).includes(d.get('_id') as string))
    .toJS();
  if (!addedDocs || !addedDocs.length) {
    return afterRemove;
  }
  const selectedIds = afterRemove.map(d => d._id);
  return afterRemove.concat(addedDocs.filter(d => !selectedIds.includes(d._id?.toString())));
}

function buildMultipleEditState(docs: EntitySchema[], propNames: string[]): MultiEditState {
  const counts: { [k: string]: { [k: string]: number } } = {};
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

async function maybeSaveMultipleEdit(dispatch: Dispatch<StoreState>, state: StoreState) {
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
  if (!diffs || !diffs.length) {
    return;
  }
  const ids = state.library.ui
    .get('selectedDocuments')
    .map(entity => entity.get('sharedId'))
    .toJS();
  const updatedDocs = await EntitiesAPI.multipleUpdate(
    new RequestParams({ ids, values: { diffMetadata: diffs } })
  );
  dispatch(notificationActions.notify('Update success', 'success'));
  dispatch(updateEntities(updatedDocs));
}

// addedDocs === null indicates that all documents are about to be unselected.
export function selectedDocumentsChanged(
  addedDocs?: EntitySchema[] | IImmutable<EntitySchema[]> | null,
  removedDocIds?: string[]
) {
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const model = 'library.sidepanel.multipleEdit';
    const state = getState();
    if (!state.library.sidepanel.multiEditOpts.get('thesaurus')) {
      return;
    }
    await maybeSaveMultipleEdit(dispatch, state);
    dispatch(formActions.reset(model));
    const docs = mergedSelectedDocuments(
      state,
      addedDocs && 'toJS' in addedDocs ? addedDocs.toJS() : addedDocs,
      removedDocIds
    );
    if (!docs.length) {
      return;
    }
    const templateIds = docs.map(d => d.template).filter(v => v);
    const templates = state.templates.filter(t => templateIds.includes(t.get('_id'))).toJS();
    const propNames = getThesaurusPropertyNames(
      state.library.sidepanel.multiEditOpts.get('thesaurus')!,
      templates
    );
    const newState = buildMultipleEditState(docs, propNames);
    dispatch(formActions.load(model, newState));
    dispatch(formActions.setPristine(model));
  };
}
