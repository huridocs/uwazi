import { actions } from 'app/BasicReducer';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { OneUpState } from 'app/istore';
import * as libraryActions from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import { store } from 'app/store';
import { actions as formActions } from 'react-redux-form';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import * as reviewActions from '../actions';

export const documents: EntitySchema[] = [
  {
    _id: 'e1i',
    template: 't1',
    sharedId: 'e1',
    title: 'Doc1',
    metadata: {
      opts: [
        { value: 'v1', label: 'V1' },
        { value: 'v2', label: 'V2' },
      ],
    },
  },
];

export const templates: TemplateSchema[] = [
  {
    _id: 't1',
    name: 'template1',
    commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    properties: [{ name: 'opts', label: 'Opts', content: 'abc', type: 'multiselect' }],
  },
];

const libraryDispatch = wrapDispatch(store!.dispatch, 'library');

describe('reviewActions', () => {
  describe('quick label actions', () => {
    beforeEach(() => {
      store!.dispatch(formActions.reset('entityView.entityForm'));
      libraryDispatch(libraryActions.setDocuments({ rows: documents }));
      store!.dispatch(actions.set('templates', templates));
      store!.dispatch(
        actions.set('oneUpReview.state', {
          requestHeaders: {},
          totalDocs: documents.length,
          loadConnections: false,
          indexInDocs: 0,
          fullEdit: false,
        } as OneUpState)
      );
      spyOn(EntitiesAPI, 'get').and.callFake(() => [documents[0]]);
      spyOn(EntitiesAPI, 'save');
    });

    it('toggleOneUpFullEdit', async () => {
      expect(store!.getState().oneUpReview.state?.toJS().fullEdit).toBe(false);
      await store!.dispatch(reviewActions.toggleOneUpFullEdit());
      expect(store!.getState().oneUpReview.state?.toJS().fullEdit).toBe(true);
      await store!.dispatch(reviewActions.toggleOneUpFullEdit());
      expect(store!.getState().oneUpReview.state?.toJS().fullEdit).toBe(false);
    });

    it('switchOneUpEntity', async () => {
      expect(store!.getState().entityView.entity.toJS()).toEqual({});
      await store!.dispatch(reviewActions.switchOneUpEntity(0, false));
      expect(store!.getState().entityView.entity.toJS()).toEqual(documents[0]);
      expect(store!.getState().entityView.entityForm).toEqual({
        _id: 'e1i',
        sharedId: 'e1',
        template: 't1',
        title: 'Doc1',
        metadata: {
          opts: ['v1', 'v2'],
        },
      });
      await store!.dispatch(reviewActions.switchOneUpEntity(2, true));
      expect(EntitiesAPI.save).toHaveBeenCalledWith({
        data: { ...documents[0], metadata: { opts: [{ value: 'v1' }, { value: 'v2' }] } },
        headers: {},
      });
      expect(store!.getState().oneUpReview.state?.toJS()).toEqual({
        fullEdit: false,
        indexInDocs: 0,
        totalDocs: 1,
        loadConnections: false,
        requestHeaders: {},
      });
    });
  });
});
