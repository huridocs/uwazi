import { actions } from '#app/BasicReducer/reducer.js';
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from '#app/utils/RequestParams.js';
import api from '#app/utils/api.js';
import { notificationActions } from '#app/Notifications/index.js';
import { IStore } from '#app/istore.js';
import { Dispatch } from 'redux';
import { ensure } from '#shared/tsUtils.js';
import { FileType } from '#shared/types/fileType.js';

const tocGenerationActions = {
  reviewToc(fileId: string) {
    return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
      const currentDoc = getState().documentViewer.doc.toJS();
      dispatch(formActions.reset('documentViewer.sidepanel.metadata'));

      const updatedFile = (await api.post('files/tocReviewed', new RequestParams({ fileId }))).json;
      const doc = {
        ...currentDoc,
        defaultDoc: updatedFile,
        documents: ensure<FileType[]>(currentDoc.documents).map(d => {
          if (d._id === updatedFile._id) {
            return updatedFile;
          }
          return d;
        }),
      };

      dispatch(notificationActions.notify('Document updated', 'success'));
      dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
      dispatch(actions.set('viewer/doc', doc));
    };
  },
};

export { tocGenerationActions };
