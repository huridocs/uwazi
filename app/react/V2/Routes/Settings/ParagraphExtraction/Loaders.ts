import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import * as pxParagraphApi from 'V2/api/paragraphExtractor/paragraphs';
import * as pxEntitiesApi from 'V2/api/paragraphExtractor/entities';
import { PXEntityLoaderResponse, PXEntityQuery } from 'V2/shared/ParagraphExtractionTypes';
import * as settingsAPI from 'V2/api/settings';
import { RequestParams } from 'app/utils/RequestParams';
import { I18NApi } from 'app/I18N';

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    return { extractors };
  };

const PXEntityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId } }): Promise<PXEntityLoaderResponse> => {
    const result: PXEntityLoaderResponse = {
      rows: [],
      filters: {},
      page: { number: 1, size: 100 },
      totalRows: 0,
    };

    if (!extractorId) return result;

    const query: PXEntityQuery = {
      id: extractorId,
      page: { number: 1, size: 100 },
      filter: { status: [] },
    };

    const extractors = await extractorsAPI.get(headers);
    const response = await pxEntitiesApi.get(query, headers);

    response.rows.forEach(row => {
      result.rows.push({ ...row, rowId: row.entity._id });
      if (result.filters[row.status.status]) {
        result.filters[row.status.status] += 1;
      } else {
        result.filters[row.status.status] = 1;
      }
    });

    result.page = response.page;
    result.totalRows = response.totalRows;
    result.extractor = extractors.find(ext => ext._id === extractorId);

    return result;
  };

const PXParagraphLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId = '' } }) => {
    const [paragraphs = [], languages, settings] = await Promise.all([
      pxParagraphApi.getByParagraphExtractorId(extractorId),
      I18NApi.getLanguages(new RequestParams({}, headers)),
      settingsAPI.get(headers),
    ]);

    return { paragraphs, extractorId, languages, settings };
  };

export { ParagraphExtractorLoader, PXEntityLoader, PXParagraphLoader };
