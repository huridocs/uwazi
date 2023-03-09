import { Params } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';

const get = (headers?: IncomingHttpHeaders, params?: Params): ClientTranslationSchema[] => {
  const requestParams = new RequestParams({ ...params }, headers);
  const response = I18NApi.get(requestParams);
  return response;
};

export { get };
