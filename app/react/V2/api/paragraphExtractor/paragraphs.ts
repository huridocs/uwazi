import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { PXParagraphAPIResponse, PXParagraphQuery } from 'shared/ParagraphExtractionTypes.js';

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
