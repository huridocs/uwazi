/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  TablePXEntityRow,
  PXEntityQuery,
  PXEntityRows,
  EntityStatus,
} from 'V2/shared/ParagraphExtractionTypes';

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

const extractParagraphs = async (entityIds: TablePXEntityRow[], headers?: IncomingHttpHeaders) => {
  const modeledPayload = {
    entityIds,
  };
  // TODO: implement this once backend is ready
  return Promise.resolve(modeledPayload);
};

const extractNewParagraphs = async (
  extractorId: string,
  entityIds: TablePXEntityRow[],
  headers?: IncomingHttpHeaders
) => {
  const modeledPayload = {
    extractorId,
    entitySharedIds: entityIds.map(entity => entity.entity._id),
  };
  const requestParams = new RequestParams(modeledPayload, headers);
  const response = await api.post('paragraphExtraction/extract', requestParams);
  return response;
};

const remove = async (entries: TablePXEntityRow[]) => {
  //model values to be sent to backend, adjust this to satisfy backend requirements
  const modeledPayload = {
    ids: entries.map(entry => entry.entity._id),
  };

  const requestParams = new RequestParams(modeledPayload);
  return Promise.resolve();
  // uncomment this once backend is ready
  // return api.delete(ENDPOINTS.DELETE_EXTRACTOR, requestParams);
};

export { get, extractParagraphs, extractNewParagraphs, remove };
