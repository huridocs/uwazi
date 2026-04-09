import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { get, CsvImportListRow } from '#V2/api/csv/index.js';

type csvLoaderResponse = {
  list: CsvImportListRow[];
};

const csvListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<csvLoaderResponse> =>
  async () => {
    const uploadedCSVs = await get(headers);
    return { list: uploadedCSVs };
  };

export type { csvLoaderResponse };
export { csvListLoader };
