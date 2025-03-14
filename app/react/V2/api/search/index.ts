import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

interface LookupOption {
  value: string;
  label: string;
  template: string;
}

interface LookupResponse {
  count: number;
  options: LookupOption[];
}

const lookup = async (
  searchTerm: string,
  templates?: string[],
  headers?: IncomingHttpHeaders
): Promise<LookupResponse> => {
  try {
    const requestParams = new RequestParams({ searchTerm, templates }, headers);
    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }
    const response = await api.get('search/lookup', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { lookup };
