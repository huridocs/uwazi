import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import * as pxParagraphApi from 'app/V2/api/paragraphExtractor/paragraphs';
import * as pxEntitiesApi from 'app/V2/api/paragraphExtractor/entities';
import * as settingsAPI from 'V2/api/settings';
import { RequestParams } from 'app/utils/RequestParams';
import { I18NApi } from 'app/I18N';

const defaultEntityQuery = {
  filter: {
    extractorId: '',
    status: [],
    languages: [],
  },
  page: {
    number: 1,
    size: 10,
  },
  sort: {
    property: '',
    order: 'desc' as const,
  },
};

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    return { extractors };
  };

const buildEntityQuery = (searchParams: URLSearchParams, extractorId: string) => ({
  ...defaultEntityQuery,
  filter: { ...defaultEntityQuery.filter, extractorId },
  page: {
    number: Number(searchParams.get('page')) || defaultEntityQuery.page.number,
    size: defaultEntityQuery.page.size,
  },
  sort: {
    property: searchParams.get('sort') || defaultEntityQuery.sort.property,
    order: (searchParams.get('order') as 'asc' | 'desc') || defaultEntityQuery.sort.order,
  },
});

const PXEntityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId = '' }, request }) => {
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const query = buildEntityQuery(searchParams, extractorId);
    const [entities, languages, filters] = await Promise.all([
      pxEntitiesApi.get(query, headers),
      I18NApi.getLanguages(new RequestParams({}, headers)),
      pxEntitiesApi.getFilters(),
    ]);
    return { entities, languages, filters };
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
