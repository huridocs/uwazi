import api from 'app/utils/api';
import superagent from 'superagent';
import { APIURL } from 'app/config.js';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import { FetchResponseError } from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';

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

const remove = async (fileId: string) => {};

const upload = async (
  file: File,
  endpoint: 'attachment' | 'custom' | 'document',
  onProgress?: (percent: number) => void
): Promise<FileType | FetchResponseError> => {
  const route = `${APIURL}files/upload/${endpoint}`;
  try {
    const response = await superagent
      .post(route)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .attach('file', file)
      .on('progress', event => {
        if (onProgress && event.percent) {
          onProgress(Math.floor(event.percent));
        }
      });

    return response.body as FileType;
  } catch (error) {
    return error as FetchResponseError;
  }
};

export { getById, getByType, update, remove, upload };
