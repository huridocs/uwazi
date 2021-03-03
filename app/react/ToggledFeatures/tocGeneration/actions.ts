import { actions } from 'app/BasicReducer/reducer';
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import { notificationActions } from 'app/Notifications';
import { IStore } from 'app/istore';
import { Dispatch } from 'redux';
import { ensure } from 'shared/tsUtils';
import { FileType } from 'shared/types/fileType';

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
