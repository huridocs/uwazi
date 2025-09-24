import { Params } from 'react-router';
import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { I18NApi } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import { FetchResponseError } from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientTranslationSchema, ClientTranslationContextSchema } from '../../istore.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { TranslationValue } from 'shared/types.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/superagent.js' or... Remove this comment to see the full error message
import { httpRequest } from 'shared/superagent.js';
// @ts-expect-error TS(2307): Cannot find module '../../App/LoadingProgressBar.j... Remove this comment to see the full error message
import loadingBar from '../../App/LoadingProgressBar.js';

const filterTranslationsByContext = (
  translations: ClientTranslationSchema[],
  contextId: string
): ClientTranslationSchema[] =>
  translations.map(language => {
    // @ts-expect-error TS(7006): Parameter 'context' implicitly has an 'any' type.
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
