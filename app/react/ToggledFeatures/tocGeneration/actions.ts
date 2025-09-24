import { actions } from '../../BasicReducer/reducer.js';
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from '../../utils/RequestParams.js';
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../Notifications.js' or its... Remove this comment to see the full error message
import { notificationActions } from '../../Notifications.js';
import { IStore } from '../../istore.js';
import { Dispatch } from 'redux';

import { ensure } from 'shared/tsUtils.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';

const tocGenerationActions = {
  reviewToc(fileId: string) {
    return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
      const currentDoc = getState().documentViewer.doc.toJS();
      dispatch(formActions.reset('documentViewer.sidepanel.metadata'));

      const updatedFile = (await api.post('files/tocReviewed', new RequestParams({ fileId }))).json;
      const doc = {
        ...currentDoc,
        defaultDoc: updatedFile,
        // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
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
