import { api } from '#app/utils/api.js';
import backend from 'fetch-mock';
import * as notificationsTypes from '#app/Notifications/actions/actionTypes.js';
import { actions as relationshipActions } from '#app/Relationships/index.js';
import { APIURL } from '#app/config.js';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { mockID } from '#shared/uniqueID.js';
import { ClientEntitySchema } from '#app/istore.js';
import { tocGenerationActions } from '../actions.js';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const createDoc = (generatedToc: boolean, fileId: string): ClientEntitySchema => ({
  name: 'doc',
  _id: 'id',
  sharedId: 'sharedId',
  defaultDoc: { _id: fileId, generatedToc },
  documents: [{ _id: fileId, generatedToc }],
});

describe('reviewToc', () => {
  it('should store the document with the response of reviewToc', done => {
    mockID();
    const fileId = 'fileId';

    backend.post(`${APIURL}files/tocReviewed`, {
      body: JSON.stringify({ _id: fileId, generatedToc: false }),
    });

    jest
      .spyOn(relationshipActions, 'reloadRelationships')
      .mockReturnValue(async () => Promise.resolve());

    const doc = createDoc(true, fileId);
    const updatedEntity = createDoc(false, fileId);

    const expectedActions = [
      { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
      {
        type: notificationsTypes.NOTIFY,
        notification: { message: 'Document updated', type: 'success', id: 'unique_id' },
      },
      { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
      { type: 'viewer/doc/SET', value: updatedEntity },
    ];

    const store = mockStore({
      documentViewer: {
        doc: Immutable.fromJS(doc),
        references: Immutable.fromJS([]),
        targetDocReferences: Immutable.fromJS([]),
        targetDoc: Immutable.fromJS(doc),
        uiState: Immutable.fromJS({}),
      },
    });

    jest.spyOn(api, 'post');
    store
      //fot this to be properly typed, redux, redux-thunk need to be updated (and probably others),
      //producing hundreds of type errors
      //@ts-ignore
      .dispatch(tocGenerationActions.reviewToc(fileId))
      .then(() => {
        expect(api.post).toHaveBeenCalledWith('files/tocReviewed', {
          data: {
            fileId: 'fileId',
          },
          headers: {},
        });
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);
  });
});
