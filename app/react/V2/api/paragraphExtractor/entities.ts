import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { PXEntityApiResponse } from 'app/V2/Routes/Settings/ParagraphExtraction/types';

const dummyData = [
  {
    _id: '1',
    title: 'John Smith',
    document: 'doc_name.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 3,
  },
  {
    _id: '2',
    title: 'Maria Garcia',
    document: 'another doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 5,
  },
  {
    _id: '3',
    title: 'Pierre Dubois',
    document: 'third_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 2,
  },
  {
    _id: '4',
    title: 'Hans Mueller',
    document: 'fourth_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 4,
  },
  {
    _id: '5',
    title: 'Giulia Rossi',
    document: 'fifth_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 6,
  },
] as PXEntityApiResponse[];

// const apiEndpoint = 'paragraph-extractor-entities';

const getByParagraphExtractorId = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    // const { json: response } = await api.get(apiEndpoint, requestParams);
    const id = requestParams.data?.id;
    return dummyData || id;
    // return response;
  } catch (e) {
    return e;
  }
};

const getById = async (entityId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: entityId }, headers);
    // const { json: response } = await api.get(apiEndpoint, requestParams);
    const id = requestParams.data?.id;
    return dummyData.find(entity => entity._id === id);
    // return response;
  } catch (e) {
    return e;
  }
};

export { getByParagraphExtractorId, getById };
