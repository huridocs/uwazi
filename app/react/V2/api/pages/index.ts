import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Page } from 'V2/shared/types';

const getBySharedId = async (
  sharedId: string,
  language: string,
  headers?: IncomingHttpHeaders
): Promise<Page> => {
  try {
    const requestParams = new RequestParams({ sharedId }, headers);
    api.locale(language);
    const response = await api.get('page', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { getBySharedId };
