import { actions } from 'app/BasicReducer';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { QuickLabelState } from 'app/istore';
import { wrapDispatch } from 'app/Multireducer';
import { store } from 'app/store';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';
import * as libraryActions from '../libraryActions';
import * as quickLabelActions from '../quickLabelActions';
import { documents, templates, thesauri } from './fixtures';

const libraryDispatch = wrapDispatch(store!.dispatch, 'library');

describe('quickLabelActions', () => {
  describe('store setup sanity check', () => {
    it('should set documents', () => {
      libraryDispatch(libraryActions.setDocuments({ rows: documents }));
      expect(store!.getState().library.documents.get('rows').toJS()).toEqual(documents);
    });
  });
  describe('quick label actions', () => {
    beforeEach(() => {
      libraryDispatch(libraryActions.setDocuments({ rows: documents }));
      store!.dispatch(actions.set('thesauris', thesauri));
      store!.dispatch(actions.set('templates', templates));
      store!.dispatch(
        actions.set('library.sidepanel.quickLabelState', {
          thesaurus: 'abc',
          autoSave: false,
        } as QuickLabelState)
      );
      spyOn(EntitiesAPI, 'multipleUpdate').and.callFake(() => documents);
    });

    it('toggleAutosave', () => {
      expect(store!.getState().library.sidepanel.quickLabelState.get('autoSave')).toBe(false);
      store!.dispatch(quickLabelActions.toggleQuickLabelAutoSave());
      expect(store!.getState().library.sidepanel.quickLabelState.get('autoSave')).toBe(true);
      store!.dispatch(quickLabelActions.toggleQuickLabelAutoSave());
      expect(store!.getState().library.sidepanel.quickLabelState.toJS()).toEqual({
        thesaurus: 'abc',
        autoSave: false,
      });
    });

    it('selectedDocumentsChanged', async () => {
      await libraryDispatch(libraryActions.selectSingleDocument(documents[0]));
      expect(store!.getState().library.sidepanel.quickLabelMetadata).toEqual({
        opts: { added: [], removed: [], originalFull: ['v1'], originalPartial: [] },
      });
      await libraryDispatch(libraryActions.selectDocuments(documents));
      expect(store!.getState().library.sidepanel.quickLabelMetadata).toEqual({
        opts: { added: [], removed: [], originalFull: [], originalPartial: ['v1', 'v2'] },
      });
    });

    it('maybeSaveQuickLabels autosave', async () => {
      store!.dispatch(quickLabelActions.toggleQuickLabelAutoSave());
      await libraryDispatch(libraryActions.selectSingleDocument(documents[0]));
      expect(EntitiesAPI.multipleUpdate).not.toHaveBeenCalled();
      await libraryDispatch(libraryActions.selectDocuments(documents));
      expect(EntitiesAPI.multipleUpdate).not.toHaveBeenCalled();
      store!.dispatch(
        formActions.change('library.sidepanel.quickLabelMetadata.opts.added', ['v1'])
      );
      await libraryDispatch(libraryActions.selectSingleDocument(documents[0]));
      expect(EntitiesAPI.multipleUpdate).toHaveBeenCalledWith(
        new RequestParams({
          ids: ['e1', 'e2'],
          values: { diffMetadata: { opts: { added: [{ value: 'v1' }], removed: [] } } },
        })
      );
    });

    it('maybeSaveQuickLabels manual save', async () => {
      await libraryDispatch(libraryActions.selectDocuments(documents));
      expect(EntitiesAPI.multipleUpdate).not.toHaveBeenCalled();
      store!.dispatch(
        formActions.change('library.sidepanel.quickLabelMetadata.opts.added', ['v1'])
      );
      await libraryDispatch(libraryActions.selectDocuments(documents));
      expect(EntitiesAPI.multipleUpdate).not.toHaveBeenCalled();
      store!.dispatch(
        formActions.change('library.sidepanel.quickLabelMetadata.opts.added', ['v1'])
      );
      await store!.dispatch(quickLabelActions.maybeSaveQuickLabels(true));
      expect(EntitiesAPI.multipleUpdate).toHaveBeenCalledWith(
        new RequestParams({
          ids: ['e1', 'e2'],
          values: { diffMetadata: { opts: { added: [{ value: 'v1' }], removed: [] } } },
        })
      );
    });
  });
});
