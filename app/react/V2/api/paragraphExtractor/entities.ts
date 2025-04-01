/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import api from 'app/utils/api';
import { FetchResponseError } from 'shared/JSONRequest';
import { RequestParams } from 'app/utils/RequestParams';
import { PXEntityTable, PXTable } from 'V2/Routes/Settings/ParagraphExtraction/types';
import { PXEntityQuery, PXEntityRows } from 'V2/shared/ParagraphExtractionTypes';

const get = async (
  parameters: PXEntityQuery,
  headers?: IncomingHttpHeaders
): Promise<PXEntityRows> => {
  try {
    const requestParams = new RequestParams(qs.stringify(parameters), headers);
    const { json: response } = await api.get(
      'paragraphExtraction/extractorStatuses',
      requestParams
    );
    return response;
  } catch (e) {
    return e;
  }
};

const getFilters = async (headers?: IncomingHttpHeaders) => {
  try {
    // const { data } = new RequestParams({  }, headers);
    const response = [
      {
        _id: '1',
        label: 'Languages',
        key: 'languages',
        options: [
          { key: 'en', label: 'English', count: 12 },
          { key: 'fr', label: 'Français', count: 26 },
          { key: 'es', label: 'Español', count: 3 },
          { key: 'pt', label: 'Portuguese', count: 9 },
        ],
      },
      {
        _id: '2',
        label: 'Status',
        key: 'status',
        options: [
          { key: 'DONE', label: 'Done', count: 12 },
          { key: 'NEW', label: 'New', count: 14 },
          { key: 'PROCESSING', label: 'Processing', count: 24 },
          { key: 'IN_QUEUE', label: 'In queue', count: 0 },
          { key: 'HAS_ERROR', label: 'Error', count: 0 },
        ],
      },
    ];

    return response;
  } catch (e) {
    return e;
  }
};

const extractParagraphs = async (entityIds: PXEntityTable[], headers?: IncomingHttpHeaders) => {
  const modeledPayload = {
    entityIds,
  };
  // TODO: implement this once backend is ready
  return Promise.resolve(modeledPayload);
};

const extractNewParagraphs = async (
  extractorId: string,
  entityIds: PXEntityTable[],
  headers?: IncomingHttpHeaders
) => {
  const modeledPayload = {
    extractorId,
    // TODO: check if this is correct
    entitySharedIds: entityIds.map(entity => entity._id),
  };
  const requestParams = new RequestParams(modeledPayload, headers);
  const response = await api.post('paragraphExtraction/extract', requestParams);
  return response;
};

const remove = async (ids: PXTable[]) => {
  //model values to be sent to backend, adjust this to satisfy backend requirements
  const modeledPayload = {
    ids: ids.map(id => id._id),
  };

  const requestParams = new RequestParams(modeledPayload);
  return Promise.resolve();
  // uncomment this once backend is ready
  // return api.delete(ENDPOINTS.DELETE_EXTRACTOR, requestParams);
};

export { get, getFilters, extractParagraphs, extractNewParagraphs, remove };
