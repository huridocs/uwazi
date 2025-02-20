/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  PXEntityApiResponse,
  PXEntityQuery,
} from 'app/V2/Routes/Settings/ParagraphExtraction/types';

const dummyData = [
  {
    _id: '1',
    title: 'John Smith',
    document: 'doc_name.pdf',
    languages: ['uk', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 3,
    status: 'NEW',
  },
  {
    _id: '2',
    title: 'Maria Garcia',
    document: 'another doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 5,
    status: 'DONE',
  },
  {
    _id: '3',
    title: 'Pierre Dubois',
    document: 'third_doc.pdf',
    languages: ['fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 2,
    status: 'IN_QUEUE',
  },
  {
    _id: '4',
    title: 'Hans Mueller',
    document: 'fourth_doc.pdf',
    languages: ['en', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 4,
    status: 'HAS_ERROR',
  },
  {
    _id: '5',
    title: 'Giulia Rossi',
    document: 'fifth_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 6,
    status: 'PROCESSING',
  },
] as PXEntityApiResponse[];

const get = async (parameters: PXEntityQuery, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(parameters, headers);
    // const { json: response } = await api.get(apiEndpoint, requestParams);
    const id = requestParams.data?.filter?.extractorId;
    return dummyData || id;
    // return response;
  } catch (e) {
    return e;
  }
};

const getFilters = async (headers?: IncomingHttpHeaders) => {
  try {
    // const { data } = new RequestParams({  }, headers);
    const response = [
      {
        _id: '1',
        label: 'Languages',
        key: 'languages',
        options: [
          { key: 'en', label: 'English', count: 12 },
          { key: 'fr', label: 'Français', count: 26 },
          { key: 'es', label: 'Español', count: 3 },
          { key: 'pt', label: 'Portuguese', count: 9 },
        ],
      },
      {
        _id: '2',
        label: 'Status',
        key: 'status',
        options: [
          { key: 'DONE', label: 'Done', count: 12 },
          { key: 'NEW', label: 'New', count: 14 },
          { key: 'PROCESSING', label: 'Processing', count: 24 },
          { key: 'IN_QUEUE', label: 'In queue', count: 0 },
          { key: 'HAS_ERROR', label: 'Error', count: 0 },
        ],
      },
    ];

    return response;
  } catch (e) {
    return e;
  }
};

export { get, getFilters };
