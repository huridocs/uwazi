import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { get, CsvImportListRow } from '#V2/api/csv/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

type csvLoaderResponse = { list: CsvImportListRow[] };

const csvListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const response = await get(headers);

    if (response instanceof FetchResponseError) {
      return { list: [] };
    }

    return { list: response };
  };

export type { csvLoaderResponse };
export { csvListLoader };
