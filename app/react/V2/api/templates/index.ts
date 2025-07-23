import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientTemplateSchema } from 'V2/shared/types';
import { Template } from 'app/apiResponseTypes';

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
