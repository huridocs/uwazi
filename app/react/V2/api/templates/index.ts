import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { ClientTemplateSchema } from 'shared/types.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { Template } from '../../apiResponseTypes.js';

const get = async (headers?: IncomingHttpHeaders): Promise<Template[]> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await api.get('templates', requestParams);
    return response.json.rows;
  } catch (e) {
    return e;
  }
};

const setDefault = async (requestParams: RequestParams) => {
  const response = await api.post('templates/setasdefault', requestParams);
  return response;
};

const remove = async (requestParams: RequestParams): Promise<{ _id: string }> => {
  const response = await api.delete('templates', requestParams);
  return response.json;
};

const checkTemplatesEntityCount = async (
  headers: IncomingHttpHeaders | undefined,
  templateIds: string[]
): Promise<Record<string, number>> => {
  if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) return {};
  const counts = await Promise.all(
    templateIds.map(async id => {
      const requestParams = new RequestParams({}, headers);
      const response = await api.get(
        `v2/entities/count_by_template?templateId=${id}`,
        requestParams
      );
      return { id, count: response.json };
    })
  );
  return counts.reduce((acc, { id, count }) => ({ ...acc, [id]: count }), {});
};

const save = async (template: ClientTemplateSchema): Promise<Template> => {
  const requestParams = new RequestParams(template);
  const response = await api.post('templates', requestParams);
  return response.json;
};

export { get, setDefault, remove, checkTemplatesEntityCount, save };
