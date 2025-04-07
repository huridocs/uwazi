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

const extractParagraphs = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const modeledPayload = {
      extractorId,
      status: EntityStatus.New,
    };
    const requestParams = new RequestParams(modeledPayload, headers);
    const response = await api.post('paragraphExtraction/extractByStatus', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const extractSelected = async (
  extractorId: string,
  entityIds: TablePXEntityRow[],
  headers?: IncomingHttpHeaders
) => {
  try {
    const modeledPayload = {
      extractorId,
      entitySharedIds: entityIds.map(entity => entity.entity.sharedId),
    };
    const requestParams = new RequestParams(modeledPayload, headers);
    const response = await api.post('paragraphExtraction/extract', requestParams);
    return response;
  } catch (e) {
    return e;
  }
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

export { get, extractParagraphs, extractSelected, remove };
