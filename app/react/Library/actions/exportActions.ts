import superagent from 'superagent';
import { toUrlParams } from 'shared/JSONRequest';
import { actions } from 'app/BasicReducer';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { t } from 'app/I18N';
import { Dispatch } from 'redux';
import { IImmutable } from 'shared/types/Immutable';
import { processFilters } from './libraryActions';
import { ExportStore } from '../reducers/ExportStoreType';
import { EntitySchema } from '../../../shared/types/entityType';

export function triggerLocalDownload(content: string, fileName: string) {
  const url: string = window.URL.createObjectURL(new Blob([content]));
  const link: HTMLAnchorElement = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild<HTMLAnchorElement>(link);
}

export function clearState(dispatch: Dispatch<any>) {
  dispatch(actions.set('exportSearchResultsProcessing', false));
  dispatch(actions.set('exportSearchResultsContent', ''));
  dispatch(actions.set('exportSearchResultFileName', ''));
}

export function exportEnd() {
  return (dispatch: Dispatch<any>, getState: () => ExportStore) => {
    triggerLocalDownload(
      getState().exportSearchResults.exportSearchResultsContent,
      getState().exportSearchResults.exportSearchResultFileName
    );

    clearState(dispatch);
  };
}

export function extractFileName(contentDisposition: string) {
  const startIndex = contentDisposition.indexOf('filename="') + 10;
  const endIndex = contentDisposition.length - 1;
  return contentDisposition.substring(startIndex, endIndex);
}

export function exportDocuments(storeKey: string) {
  return async (dispatch: Dispatch<any>, getState: any) => {
    const state = getState()[storeKey];
    const { search, filters } = state;
    const exportFilters = filters.toJS();

    const finalSearchParams = processFilters(search, exportFilters, 10000);
    finalSearchParams.searchTerm = state.search.searchTerm;

    if (state.ui.get('selectedDocuments').size) {
      finalSearchParams.ids = state.ui
        .get('selectedDocuments')
        .map((entity: IImmutable<EntitySchema>) => entity.get('sharedId'));
    }

    if (storeKey === 'uploads') finalSearchParams.unpublished = true;

    dispatch(actions.set('exportProcessing', true));
    return superagent
      .get(`/api/export${toUrlParams(finalSearchParams)}`)
      .set('Accept', 'text/csv')
      .set('X-Requested-With', 'XMLHttpRequest')
      .then(response => {
        const fileName = extractFileName(response.header['content-disposition']);
        dispatch(actions.set('exportSearchResultsContent', response.text));
        dispatch(actions.set('exportSearchResultFileName', fileName));
        dispatch(exportEnd());
        return response;
      })
      .catch(err => {
        clearState(dispatch);
        dispatch(notify(t('System', 'An error has occured during data export'), 'danger'));
        return err;
      });
  };
}
