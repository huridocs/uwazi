/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from '#app/utils/RequestParams.js';
import {
  ParagraphExtractorApiPayload,
  PXTable,
} from '#V2/Routes/Settings/ParagraphExtraction/types.js';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';
import { api } from '#app/utils/api.js';

const get = async (headers?: IncomingHttpHeaders): Promise<Extractor[]> => {
  const requestParams = new RequestParams({}, headers);
  const response = await api.get('paragraphExtraction/extractors', requestParams);
  return response.json;
};

const save = async (extractorValues: ParagraphExtractorApiPayload): Promise<Extractor> => {
  const modelPayload = {
    sourceTemplateId: extractorValues.sourceTemplateId,
    targetTemplateId: extractorValues.targetTemplateId,
    paragraphPropertyId: extractorValues.paragraphPropertyId,
    paragraphNumberPropertyId: extractorValues.paragraphNumberPropertyId,
    sourceRelationshipTypeId: extractorValues.sourceRelationshipId,
    targetRelationshipTypeId: extractorValues.targetRelationshipId,
  };

  const requestParams = new RequestParams(modelPayload);
  return api.post('paragraphExtraction/extractor', requestParams);
};

const remove = async (extractors: PXTable[]) =>
  Promise.all(
    extractors.map(extractor => {
      const id = extractor._id;
      const requestParams = new RequestParams({ id });
      return api.delete('paragraphExtraction/extractor', requestParams);
    })
  );

export { get, save, remove };
