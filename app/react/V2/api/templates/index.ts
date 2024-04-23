import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientTemplateSchema } from 'app/istore';

const get = async (headers?: IncomingHttpHeaders): Promise<ClientTemplateSchema[]> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await api.get('templates', requestParams);
    return response.json.rows;
  } catch (e) {
    return e;
  }
};

export { get };
