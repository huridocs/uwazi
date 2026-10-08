/**
 * @jest-environment node
 */
import { apiClient } from '#V2/api/client.js';
import { multipleUpdate } from '../multipleUpdate.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    postJson: jest.fn(),
  },
}));

describe('entities multipleUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts ids, metadata and translations with the active language', async () => {
    const request = {
      ids: ['a', 'b'],
      values: {
        metadata: { summary: [{ value: 'Hello' }] },
        translations: { es: { summary: [{ value: 'Hola' }] } },
      },
    };
    jest.mocked(apiClient.postJson).mockResolvedValue([[{ sharedId: 'a' }]]);

    const response = await multipleUpdate(request, 'en');

    expect(apiClient.postJson).toHaveBeenCalledWith('entities/multipleupdate', request, {
      headers: { 'Content-Language': 'en' },
      language: 'en',
    });
    expect(response).toEqual([[{ sharedId: 'a' }]]);
  });
});
