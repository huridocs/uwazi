import { Params } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import api from '../../utils/api.js';
import { I18NApi } from '../../I18N/index.js';
import { FetchResponseError } from '../../shared/JSONRequest.js';
import { ClientTranslationSchema, ClientTranslationContextSchema } from '../../istore.js';
import { RequestParams } from '../../utils/RequestParams.js';
import { TranslationValue } from '../../shared/types.js';
import { httpRequest } from '../../shared/superagent.js';
import loadingBar from '../../App/LoadingProgressBar.js';

const filterTranslationsByContext = (
  translations: ClientTranslationSchema[],
  contextId: string
): ClientTranslationSchema[] =>
  translations.map(language: any => {
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
  const response = api.get('v2/translations', params);
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
): Promise<number | FetchResponseError> => {
  try {
    const translations = updatedTranslations.map(ut => ({
      ...ut,
      context: { id: context.id, label: context.label, type: context.type },
    }));
    const params = new RequestParams(translations, headers);
    const response = await api.post('v2/translations', params);
    return response.status;
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

export { get, getV2, post, postV2, importTranslations };
