import superagent from 'superagent';
import { toUrlParams } from 'shared/JSONRequest';
import { actions } from 'app/BasicReducer';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { t } from 'app/I18N';
import { processFilters } from './libraryActions';

export function triggerLocalDownload(content, fileName) {
  const url = window.URL.createObjectURL(new Blob([content]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}

export function exportEnd() {
  return (dispatch, getState) => {
    triggerLocalDownload(
      getState().entityExport.exportContent,
      getState().entityExport.exportFileName
    );

    dispatch(actions.set('exportProcessing', false));
    dispatch(actions.set('exportContent', ''));
    dispatch(actions.set('exportFileName', ''));
  };
}

export function extractFileName(contentDisposition) {
  const startIndex = contentDisposition.indexOf('filename="') + 10;
  const endIndex = contentDisposition.length - 1;
  return contentDisposition.substring(startIndex, endIndex);
}

export function exportDocuments(storeKey) {
  // eslint-disable-next-line max-statements
  return (dispatch, getState) => {
    const state = getState()[storeKey];
    let currentFilters = state.filters;
    const { search } = state;
    currentFilters = currentFilters.toJS ? currentFilters.toJS() : currentFilters;

    const finalSearchParams = processFilters(search, currentFilters, 10000);
    finalSearchParams.searchTerm = state.search.searchTerm;

    if (state.ui.get('selectedDocuments').size) {
      finalSearchParams.ids = state.ui
        .get('selectedDocuments')
        .map(document => document.get('sharedId'));
    }

    if (storeKey === 'uploads') finalSearchParams.unpublished = true;

    dispatch(actions.set('exportProcessing', true));
    return superagent
      .get(`/api/export${toUrlParams(finalSearchParams)}`)
      .set('Accept', 'text/csv')
      .set('X-Requested-With', 'XMLHttpRequest')
      .then(response => {
        const fileName = extractFileName(response.header['content-disposition']);
        dispatch(actions.set('exportContent', response.text));
        dispatch(actions.set('exportFileName', fileName));
        dispatch(exportEnd());
        return response;
      })
      .catch(err => {
        dispatch(actions.set('exportProcessing', false));
        dispatch(actions.set('exportContent', ''));
        dispatch(actions.set('exportFileName', ''));
        dispatch(notify(t('System', 'An error has occured during data export'), 'danger'));
        return err;
      });
  };
}
