import { Params } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';
import { httpRequest } from 'shared/superagent';
import loadingBar from 'app/App/LoadingProgressBar';

const filterTranslationsByContext = (
  translations: ClientTranslationSchema[],
  contextId: string
): ClientTranslationSchema[] =>
  translations.map(language => {
    const contexts = language.contexts.filter(context => context.id === contextId);
    return { ...language, contexts };
  });

const get = async (
  headers?: IncomingHttpHeaders,
  params?: Params
): Promise<ClientTranslationSchema[]> => {
  const requestParams = new RequestParams({ ...params }, headers);
  const response = I18NApi.get(requestParams);
  return response;
};

const post = async (updatedTranslations: ClientTranslationSchema[], contextId: string) => {
  try {
    const translations = await Promise.all(
      updatedTranslations.map(language => I18NApi.save(new RequestParams(language)))
    );
    return filterTranslationsByContext(translations, contextId);
  } catch (e) {
    return e;
  }
};

const importTranslations = async (
  file: File,
  contextId: string
): Promise<ClientTranslationSchema[]> => {
  loadingBar.start();
  try {
    const translations = (await httpRequest(
      'translations/import',
      { context: contextId },
      {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      file
    )) as ClientTranslationSchema[];
    return filterTranslationsByContext(translations, contextId);
  } catch (e) {
    return e;
  } finally {
    loadingBar.done();
  }
};

const { getLanguages } = I18NApi;

export { get, post, importTranslations, getLanguages };
