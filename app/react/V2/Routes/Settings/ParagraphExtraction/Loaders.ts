import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import * as pxParagraphApi from 'V2/api/paragraphExtractor/paragraphs';
import * as pxEntitiesApi from 'V2/api/paragraphExtractor/entities';
import {
  PXEntityLoaderResponse,
  PXEntityQuery,
  PXParagraphQuery,
} from 'V2/shared/ParagraphExtractionTypes';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { PXParagraphsLoaderResponse } from './types';

const PAGE_SIZE = 10;

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
    const { page = '1', status } = searchParamsFromSearchParams(urlSearchParams);

    const result: PXEntityLoaderResponse = {
      rows: [],
      page: { number: page, size: PAGE_SIZE },
      totalRows: 0,
    };

    if (!extractorId) return result;

    const query: PXEntityQuery = {
      id: extractorId,
      page: { number: Number(page), size: PAGE_SIZE },
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
  async ({ request, params: { sharedId, extractorId } }): Promise<PXParagraphsLoaderResponse> => {
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const { page = '1' } = searchParamsFromSearchParams(urlSearchParams);
    const query: PXParagraphQuery = {
      id: sharedId,
      extractorId,
      page: { number: Number(page), size: PAGE_SIZE },
    };

    const extractors = await extractorsAPI.get(headers);
    const paragraphs = await pxParagraphApi.getByParagraphExtractorId(query, headers);

    const extractor = extractors.find(ext => ext._id === extractorId);

    const templateId = paragraphs.rows[0].entities[0].template?.toString() || '';

    return { paragraphs, templateId, propertyId: extractor?.sourceTemplateId || '' };
  };

export { ParagraphExtractorLoader, PXEntityLoader, PXParagraphLoader };
