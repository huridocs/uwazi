import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  PXParagraphQuery,
  PXParagraphsLoaderResponse,
} from 'app/V2/shared/ParagraphExtractionTypes';

const getByParagraphExtractorId = async (
  parameters: PXParagraphQuery,
  headers?: IncomingHttpHeaders
): Promise<PXParagraphsLoaderResponse> => {
  try {
    const requestParams = new RequestParams(qs.stringify(parameters), headers);
    const { json: response } = await api.get('paragraphExtraction/entityParagraphs', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { getByParagraphExtractorId };
