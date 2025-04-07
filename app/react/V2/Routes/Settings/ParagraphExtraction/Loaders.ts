import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import * as pxParagraphApi from 'V2/api/paragraphExtractor/paragraphs';
import * as pxEntitiesApi from 'V2/api/paragraphExtractor/entities';
import * as entitiesApi from 'V2/api/entities';
import * as settingsApi from 'V2/api/settings';
import * as templatesApi from 'V2/api/templates';
import {
  PXEntityLoaderResponse,
  PXEntityQuery,
  PXParagraphQuery,
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from 'V2/shared/ParagraphExtractionTypes';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { ClientEntitySchema } from 'app/istore';

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

    const [extractors, pxEntityRows] = await Promise.all([
      extractorsAPI.get(headers),
      pxEntitiesApi.get(query, headers),
    ]);

    pxEntityRows.rows?.forEach(row => {
      result.rows.push({ ...row, rowId: row.entity._id!.toString() });
    });

    result.page = pxEntityRows.page;
    result.totalRows = pxEntityRows.totalRows;
    result.extractor = extractors.find(ext => ext._id === extractorId);

    return result;
  };

const getPXProperties = (
  entity: ClientEntitySchema,
  textProperty: string,
  paragraphNumberProperty: string
) => {
  const extractedParagraph: TablePXEntityParagraphRow = {
    sharedId: entity.sharedId!,
    title: entity.title!,
    language: entity.language!,
    template: entity.template?.toString()!,
    rowId: entity._id!.toString(),
    paragraphText: entity.metadata?.[textProperty]?.[0].value?.toString() || '',
    paragraphNumber: Number(entity.metadata?.[paragraphNumberProperty]?.[0].value) || 0,
    _id: entity._id?.toString() || '',
  };
  return extractedParagraph;
};

const PXParagraphLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({
    request,
    params: { sharedId = '', extractorId = '' },
  }): Promise<PXParagraphLoaderResponse> => {
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const { page = '1' } = searchParamsFromSearchParams(urlSearchParams);

    const result: PXParagraphLoaderResponse = {
      rows: [],
      page: { number: page, size: PAGE_SIZE },
      totalRows: 0,
    };

    const defaultLanguage = (await settingsApi.get(headers)).languages?.find(lang => lang.default);

    const extractors = await extractorsAPI.get(headers);
    const extractor = extractors.find(ext => ext._id === extractorId);

    if (!extractorId || !sharedId || !extractor) return result;

    const query: PXParagraphQuery = {
      id: sharedId,
      extractorId,
      page: { number: Number(page), size: PAGE_SIZE },
    };

    const [paragraphs, [sourceEntity], templates] = await Promise.all([
      pxParagraphApi.getByParagraphExtractorId(query, headers),
      entitiesApi.getBySharedId({ sharedId, language: defaultLanguage?.key || '' }, headers),
      templatesApi.get(headers),
    ]);

    const template = templates.find(temp => temp._id === extractor.targetTemplateId);
    const textProperty = template?.properties.find(
      property => property._id === extractor.paragraphPropertyId
    );
    const numberProperty = template?.properties.find(
      property => property._id === extractor.paragraphNumberPropertyId
    );

    const paragraphsRows = paragraphs.rows?.map(row => {
      const [defaultLanguageEntity, ...otherLanguagesEntities] = row.entities.map(entity =>
        getPXProperties(entity, textProperty?.name || '', numberProperty?.name || '')
      );

      return { ...defaultLanguageEntity, subRows: otherLanguagesEntities };
    });

    return {
      rows: paragraphsRows,
      page: paragraphs.page,
      totalRows: paragraphs.totalRows,
      extractor,
      sourceEntity,
    };
  };

export { ParagraphExtractorLoader, PXEntityLoader, PXParagraphLoader };
