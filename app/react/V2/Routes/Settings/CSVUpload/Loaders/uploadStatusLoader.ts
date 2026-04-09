import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { getById } from '#V2/api/csv/index.js';

const uploadStatusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.entry) {
      return getById(params.entry, headers);
    }
    return undefined;
  };

export { uploadStatusLoader };
