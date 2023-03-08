import { Params } from 'react-router-dom';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';

const get = (request: Request, params?: Params): ClientTranslationSchema[] => {
  const requestParams = new RequestParams({ ...request, ...params });
  const response = I18NApi.get(requestParams);
  return response;
};

export { get };
