/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import api from 'app/utils/api';
import { FetchResponseError } from 'shared/JSONRequest';
import { RequestParams } from 'app/utils/RequestParams';
import { PXTable } from 'V2/Routes/Settings/ParagraphExtraction/types';
import { TablePXEntityRow, PXEntityQuery, PXEntityRows, EntityStatus } from 'V2/shared/ParagraphExtractionTypes';

const get = async (
  parameters: PXEntityQuery,
  headers?: IncomingHttpHeaders
): Promise<PXEntityRows> => {
  try {
    const requestParams = new RequestParams(qs.stringify(parameters), headers);
    const response = {
      rows: [
        {
          id: '1',
          name: 'Entity 1',
          status: { _id: 'status1', status: EntityStatus.Processed },
          language: 'en',
          entity: { _id: 'entity1', sharedId: 'shared1', title: 'Title 1', language: 'en' },
          availableFileLanguages: ['en'],
          paragraphsCount: 10,
        },
        {
          id: '2',
          name: 'Entity 2',
          status: { _id: 'status2', status: EntityStatus.New },
          language: 'fr',
          entity: { _id: 'entity2', sharedId: 'shared2', title: 'Title 2', language: 'fr' },
          availableFileLanguages: ['fr'],
          paragraphsCount: 5,
        },
        {
          id: '3',
          name: 'Entity 3',
          status: { _id: 'status3', status: EntityStatus.Processing },
          language: 'es',
          entity: { _id: 'entity3', sharedId: 'shared3', title: 'Title 3', language: 'es' },
          availableFileLanguages: ['es'],
          paragraphsCount: 8,
        },
        {
          id: '4',
          name: 'Entity 4',
          status: { _id: 'status4', status: EntityStatus.Processing },
          language: 'pt',
          entity: { _id: 'entity4', sharedId: 'shared4', title: 'Title 4', language: 'pt' },
          availableFileLanguages: ['pt'],
          paragraphsCount: 3,
        },
      ],
      page: {
        number: 1,
        size: 4
      },
      totalRows: 4,
    };
    return response;
    // const { json: response } = await api.get(
    //   'paragraphExtraction/extractorStatuses',
    //   requestParams
    // );
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

const extractParagraphs = async (entityIds: TablePXEntityRow[], headers?: IncomingHttpHeaders) => {
  const modeledPayload = {
    entityIds,
  };
  // TODO: implement this once backend is ready
  return Promise.resolve(modeledPayload);
};

const extractNewParagraphs = async (
  extractorId: string,
  entityIds: TablePXEntityRow[],
  headers?: IncomingHttpHeaders
) => {
  const modeledPayload = {
    extractorId,
    // TODO: check if this is correct
    entitySharedIds: entityIds.map(entity => entity.entity._id),
  };
  const requestParams = new RequestParams(modeledPayload, headers);
  const response = await api.post('paragraphExtraction/extract', requestParams);
  return response;
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

export { get, getFilters, extractParagraphs, extractNewParagraphs, remove };
