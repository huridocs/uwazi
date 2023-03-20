import { Params } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (
  headers?: IncomingHttpHeaders,
  params?: Params
): Promise<ClientTranslationSchema[]> => {
  const requestParams = new RequestParams({ ...params }, headers);
  const response = I18NApi.get(requestParams);
  return response;
};

const post = async (updatedTranslations: ClientTranslationSchema[]) =>
  Promise.all(updatedTranslations.map(language => I18NApi.save(new RequestParams(language))));

export { get, post };
