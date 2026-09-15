/**
 * @jest-environment node
 */
import { apiClient } from '#V2/api/client.js';
import type { Entity } from '../types.js';
import { getById, getBySharedId } from '../index.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

const languageOptions = {
  headers: { 'Content-Language': 'en' },
  language: 'en',
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

describe('entities get api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always includes permissions on getById', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ rows: [entity] }]);

    const [data, error] = await getById({ _id: 'e1', language: 'en' });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'entities',
      { _id: 'e1', omitRelationships: true, include: ['permissions'] },
      languageOptions
    );
    expect(error).toBeUndefined();
    expect(data).toEqual(entity);
  });

  it('always includes permissions on getBySharedId', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ rows: [entity] }]);

    const [data, error] = await getBySharedId({ sharedId: 's1', language: 'en' });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'entities',
      { sharedId: 's1', omitRelationships: true, include: ['permissions'] },
      languageOptions
    );
    expect(error).toBeUndefined();
    expect(data).toEqual([entity]);
  });
});
