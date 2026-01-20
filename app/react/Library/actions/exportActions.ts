

import superagent from 'superagent';
import { actions } from '#app/BasicReducer/index.js';
import { notify } from '#app/Notifications/actions/notificationsActions.js';
import { t } from '#app/I18N/index.js';
import { Dispatch } from 'redux';

import { IImmutable } from '#shared/types/Immutable.js';

import { CaptchaValue } from '#shared/types/Captcha.js';

import { EntitySchema } from '#shared/types/entityType.js';

import { CsvExportBody } from '#shared/types/searchParameterType.js';
import { processFilters } from '#app/Library/actions/libraryActions.js';
import { ExportStore } from '../reducers/ExportStoreType';
import Immutable from 'immutable';

const { List } = Immutable;
export function triggerLocalDownload(content: string, fileName: string) {
  const url: string = window.URL.createObjectURL(new Blob([content]));
  const link: HTMLAnchorElement = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild<HTMLAnchorElement>(link);
}

function clearState(dispatch: Dispatch<any>) {
  dispatch(actions.set('exportSearchResultsProcessing', false));
  dispatch(actions.set('exportSearchResultsContent', ''));
  dispatch(actions.set('exportSearchResultsFileName', ''));
}

export function exportEnd() {
  return (dispatch: Dispatch<any>, getState: () => ExportStore) => {
    const { exportSearchResultsContent, exportSearchResultsFileName } =
      getState().exportSearchResults;

    triggerLocalDownload(exportSearchResultsContent, exportSearchResultsFileName);

    clearState(dispatch);
  };
}

function extractFileName(contentDisposition: string) {
  const startIndex = contentDisposition.indexOf('filename="') + 10;
  const endIndex = contentDisposition.length - 1;
  return contentDisposition.substring(startIndex, endIndex);
}

const requestHandler = (
  _params: CsvExportBody & { ids?: List<string> },
  dispatch: Dispatch<any>,
  captcha?: CaptchaValue
) => {
  const params = { ..._params };
  if (params.ids) params.ids = params.ids.toJS();
  let request = superagent
    .post('/api/export')
    .send(params)
    .set('Accept', 'text/csv')
    .set('X-Requested-With', 'XMLHttpRequest');

  if (captcha) {
    request = request.set('Captcha-text', captcha.text).set('Captcha-id', captcha.id);
  }

  request
    .then(response => {
      const fileName = extractFileName(response.header['content-disposition']);
      dispatch(actions.set('exportSearchResultsContent', response.text));
      dispatch(actions.set('exportSearchResultsFileName', fileName));
      dispatch(exportEnd());
    })
    .catch(err => {
      clearState(dispatch);
      if (err.status === 403) {
        dispatch(notify(t('System', 'Invalid captcha', null, false), 'danger'));
      } else {
        dispatch(
          notify(t('System', 'An error has occurred during data export', null, false), 'danger')
        );
      }
      return err;
    });
};

export function exportDocuments(storeKey: string, captcha?: CaptchaValue) {
  return async (dispatch: Dispatch<any>, getState: any) => {
    const state = getState().library;
    const { search, filters } = state;
    const exportFilters = filters.toJS();

    const finalSearchParams = processFilters(search, exportFilters, {
      limit: 10000,
      encoding: false,
    });

    finalSearchParams.searchTerm = state.search.searchTerm;

    if (state.ui.get('selectedDocuments').size) {
      finalSearchParams.ids = state.ui
        .get('selectedDocuments')
        .map((entity: IImmutable<EntitySchema>) => entity.get('sharedId'));
    }

    if (storeKey === 'uploads') finalSearchParams.unpublished = true;

    dispatch(actions.set('exportSearchResultsProcessing', true));

    requestHandler(finalSearchParams, dispatch, captcha);
  };
}
