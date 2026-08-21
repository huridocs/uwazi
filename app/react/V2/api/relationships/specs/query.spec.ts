/**
 * @jest-environment node
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { getAnchors, getResolved, getSummary } from '../query.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

const languageOptions = {
  headers: { 'Content-Language': 'en' },
  language: 'en',
};

describe('relationships query api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests summary with Content-Language', async () => {
    const rows = [
      {
        _id: 'c1',
        hub: 'h1',
        entity: 'source',
        template: null,
        entityData: { title: 'Source', template: 't1' },
      },
    ];
    jest.mocked(apiClient.getJson).mockResolvedValue([{ rows }]);

    const [data, error] = await getSummary('source', 'en');

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'relationships/summary',
      { sharedId: 'source' },
      languageOptions
    );
    expect(error).toBeUndefined();
    expect(data).toEqual(rows);
  });

  it('requests anchors with file and Content-Language', async () => {
    const rows = [
      {
        _id: 'c1',
        reference: { selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, page: '1' }] },
      },
    ];
    jest.mocked(apiClient.getJson).mockResolvedValue([{ rows }]);

    const [data] = await getAnchors('source', 'file1', 'es');

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'relationships/anchors',
      { sharedId: 'source', file: 'file1' },
      { headers: { 'Content-Language': 'es' }, language: 'es' }
    );
    expect(data).toEqual(rows);
  });

  it('treats http 404 as an empty graph (defensive; API returns 200 for missing sources)', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValue([undefined, new ApiError('Not found', { kind: 'http', status: 404 })]);

    await expect(getSummary('missing', 'en')).resolves.toEqual([[]]);
    await expect(getAnchors('missing', 'file1', 'en')).resolves.toEqual([[]]);
    await expect(getResolved('missing', 'en')).resolves.toEqual([[]]);
  });

  it('propagates non-404 errors', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    jest.mocked(apiClient.getJson).mockResolvedValue([undefined, error]);

    await expect(getResolved('source', 'en')).resolves.toEqual([undefined, error]);
  });
});
