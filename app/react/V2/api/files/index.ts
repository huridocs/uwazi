import api from '#app/utils/api.js';

import { RequestParams } from '#app/utils/RequestParams.js';
import { IncomingHttpHeaders } from 'http';

import { FetchResponseError } from '#shared/JSONRequest.js';

import { FileType } from '#shared/types/fileType.js';

enum OcrStatus {
  NONE = 'noOCR',
  PROCESSING = 'inQueue',
  ERROR = 'cannotProcess',
  READY = 'withOCR',
  UNSUPPORTED_LANGUAGE = 'unsupported_language',
}

const getById = async (_id: string): Promise<FileType[]> => {
  try {
    const requestParams = new RequestParams({ _id });
    const { json: response } = await api.get('files', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const getByType = async (
  type: FileType['type'],
  header?: IncomingHttpHeaders
): Promise<FileType[]> => {
  try {
    const requestParams = new RequestParams({ type }, header);
    const { json: response } = await api.get('files', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const update = async (file: FileType): Promise<FileType | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(file);
    const { json: response } = await api.post('files', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const remove = async (_id: FileType['_id']): Promise<FileType | FetchResponseError> => {
  try {
    const requestParams = new RequestParams({ _id });
    const { json: response } = await api.delete('files', requestParams);
    return response[0];
  } catch (e) {
    return e;
  }
};

const getPagePlaintext = async (
  _id: string,
  page: number,
  header?: IncomingHttpHeaders
): Promise<string | FetchResponseError> => {
  try {
    const requestParams = new RequestParams({ _id, page }, header);
    const response = await api.get('documents/page', requestParams);
    return response.json.data;
  } catch (e) {
    return e;
  }
};

const postToOcr = async (filename: string): Promise<{ status: number } | FetchResponseError> => {
  try {
    const status = await api.post(`files/${filename}/ocr`);
    return { status };
  } catch (e) {
    return e;
  }
};

const getOcrStatus = async (
  filename: string
): Promise<{ status: OcrStatus; lastUpdated?: number } | FetchResponseError> => {
  try {
    const {
      json: { status, lastUpdated },
    } = await api.get(`files/${filename}/ocr`);

    return { status, lastUpdated };
  } catch (e) {
    return e;
  }
};

export { OcrStatus };
export { UploadService } from '#V2/api/files/UploadService.js';
export { getById, getByType, update, remove, getPagePlaintext, postToOcr, getOcrStatus };
