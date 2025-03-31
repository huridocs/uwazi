/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import {
  ParagraphExtractorApiResponse,
  ParagraphExtractorApiPayload,
  PXTable,
} from 'app/V2/Routes/Settings/ParagraphExtraction/types';
import api from 'app/utils/api';

const API_BASE = 'paragraphExtraction';
const ENDPOINTS = {
  CREATE_EXTRACTOR: `${API_BASE}/extractor`,
  GET_EXTRACTORS: `${API_BASE}/extractors`,
  DELETE_EXTRACTOR: `${API_BASE}/extractor`, // TODO: adjust this once available
};

const get = async (headers?: IncomingHttpHeaders): Promise<ParagraphExtractorApiResponse[]> => {
  const requestParams = new RequestParams({}, headers);
  const response = await api.get(ENDPOINTS.GET_EXTRACTORS, requestParams);
  return response.json;
};

const save = async (
  extractorValues: ParagraphExtractorApiPayload
): Promise<ParagraphExtractorApiResponse> => {
  //model values to be sent to backend, adjust this to satisfy backend requirements
  const modelPayload = {
    sourceTemplateId: extractorValues.sourceTemplateId,
    targetTemplateId: extractorValues.targetTemplateId,
    paragraphPropertyId: extractorValues.paragraphPropertyId,
    paragraphNumberPropertyId: extractorValues.paragraphNumberPropertyId,
    // api requires these two fields, but only one field is on the design
    sourceRelationshipTypeId: extractorValues.relationshipId,
    targetRelationshipTypeId: extractorValues.relationshipId,
  };

  const requestParams = new RequestParams(modelPayload);
  // this returns an id of the created extractor,
  // probably should be used if ever we want to redirect to created extractor page with entities
  return api.post(ENDPOINTS.CREATE_EXTRACTOR, requestParams);
};

const remove = async (ids: PXTable[]) => {
  //model values to be sent to backend, adjust this to satisfy backend requirements
  const modeledPayload = {
    ids: ids.map(id => id._id),
  };

  const requestParams = new RequestParams(modeledPayload);
  return Promise.resolve();
  // uncomment this once backend is ready
  // return api.delete(ENDPOINTS.DELETE_EXTRACTOR, requestParams);
};

export { get, save, remove };
