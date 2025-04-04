import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import * as pxParagraphApi from 'V2/api/paragraphExtractor/paragraphs';
import * as pxEntitiesApi from 'V2/api/paragraphExtractor/entities';
import {
  PXEntityLoaderResponse,
  PXEntityQuery,
  PXParagraphQuery,
  PXParagraphsLoaderResponse,
} from 'V2/shared/ParagraphExtractionTypes';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    return { extractors };
  };

const PXEntityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({ request, params: { extractorId } }): Promise<PXEntityLoaderResponse> => {
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const { page = '1', size = '10', status } = searchParamsFromSearchParams(urlSearchParams);

    const result: PXEntityLoaderResponse = {
      rows: [],
      page: { number: page, size },
      totalRows: 0,
    };

    if (!extractorId) return result;

    const query: PXEntityQuery = {
      id: extractorId,
      page: { number: Number(page), size: Number(size) },
      ...(status ? { filter: { status: [status].flat() } } : {}),
    };

    const extractors = await extractorsAPI.get(headers);
    const response = await pxEntitiesApi.get(query, headers);

    response.rows?.forEach(row => {
      result.rows.push({ ...row, rowId: row.entity._id });
    });

    result.page = response.page;
    result.totalRows = response.totalRows;
    result.extractor = extractors.find(ext => ext._id === extractorId);

    return result;
  };

const PXParagraphLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({
    request,
    params: { entityId: id = '', extractorId = '' },
  }): Promise<PXParagraphsLoaderResponse> => {
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const { page = '1', size = '10' } = searchParamsFromSearchParams(urlSearchParams);
    const query: PXParagraphQuery = {
      id,
      extractorId,
      page: { number: Number(page), size: Number(size) },
    };

    const paragraphs: PXParagraphsLoaderResponse = await pxParagraphApi.getByParagraphExtractorId(
      query,
      headers
    );

    return paragraphs;
  };

export { ParagraphExtractorLoader, PXEntityLoader, PXParagraphLoader };
