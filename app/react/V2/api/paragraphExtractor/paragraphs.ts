import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { PXParagraphAPIResponse, PXParagraphQuery } from '#V2/shared/ParagraphExtractionTypes.js';

const getByParagraphExtractorId = async (
  parameters: PXParagraphQuery,
  headers?: IncomingHttpHeaders
): Promise<PXParagraphAPIResponse> => {
  try {
    const requestParams = new RequestParams(qs.stringify(parameters), headers);
    const { json: response } = await api.get('paragraphExtraction/entityParagraphs', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { getByParagraphExtractorId };
