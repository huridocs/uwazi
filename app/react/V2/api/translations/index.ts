import { Params } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';
import { httpRequest } from 'shared/superagent';
import loadingBar from 'app/App/LoadingProgressBar';

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

const importTranslations = async (
  file: File,
  context: string
): Promise<ClientTranslationSchema[]> => {
  loadingBar.start();
  const translations = await httpRequest(
    'translations/import',
    { context },
    {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    file
  );
  loadingBar.done();
  return translations as ClientTranslationSchema[];
};

export { get, post, importTranslations };
