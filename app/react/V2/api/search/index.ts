import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { SearchQuery } from 'shared/types/SearchQueryType';
import { EntitySchema } from 'shared/types/entityType';

interface LookupResponse {
  data: (Pick<EntitySchema, 'title' | 'sharedId' | 'template'> & { _id: string })[];
  links?: {
    self: string;
    first?: string | null;
    last?: string | null;
    next?: string | null;
    prev?: string | null;
  };
}

const lookup = async (
  entityTitle: string,
  template?: string,
  headers?: IncomingHttpHeaders
): Promise<LookupResponse> => {
  try {
    const search: SearchQuery = {
      fields: ['title', 'sharedId', 'template'],
      filter: {
        searchString: entityTitle,
        ...(template && { template }),
      },
    };

    const requestParams = new RequestParams(qs.stringify(search), headers);
    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }

    const response: { json: LookupResponse } = await api.get('v2/search', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { lookup };
