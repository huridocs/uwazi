import { Params } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema, ClientTranslationContextSchema } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';
import { TranslationValue } from 'V2/shared/types';
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

const getV2 = async (
  headers?: IncomingHttpHeaders,
  parameters?: Params
): Promise<ClientTranslationSchema[]> => {
  const params = new RequestParams(parameters, headers);
  const response = api.get('translationsV2', params);
  return response;
};

const post = async (
  updatedTranslations: ClientTranslationSchema[],
  contextId: string
): Promise<ClientTranslationSchema[]> => {
  try {
    const translations = await Promise.all(
      updatedTranslations.map(language => I18NApi.save(new RequestParams(language)))
    );
    return filterTranslationsByContext(translations, contextId);
  } catch (e) {
    return e;
  }
};

const postV2 = async (
  updatedTranslations: TranslationValue[],
  context: ClientTranslationContextSchema,
  headers?: IncomingHttpHeaders
): Promise<ClientTranslationSchema[]> => {
  try {
    const translations = updatedTranslations.map(ut => ({ ...ut, context }));
    const params = new RequestParams(translations, headers);
    const response = await api.post('translationsV2', params);
    return response.status.ok;
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

export { get, getV2, post, postV2, importTranslations, getLanguages };
