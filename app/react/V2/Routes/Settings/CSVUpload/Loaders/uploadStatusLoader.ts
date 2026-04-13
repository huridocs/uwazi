import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { getById } from '#V2/api/csv/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

const uploadStatusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.entry) {
      const response = getById(params.entry, headers);
      if (response instanceof FetchResponseError) {
        return undefined;
      }
      return response;
    }

    return undefined;
  };

export { uploadStatusLoader };
