/**
 * @jest-environment jsdom
 */
import * as relationshipsQueryApi from '#V2/api/relationships/query.js';
import { httpRelationshipsQueryService } from '../HttpRelationshipsQueryService.js';

jest.mock('#V2/api/relationships/query.js', () => ({
  getSummary: jest.fn(),
  getAnchors: jest.fn(),
  getResolved: jest.fn(),
}));

describe('HttpRelationshipsQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates summary, anchors, and resolved reads', async () => {
    jest.mocked(relationshipsQueryApi.getSummary).mockResolvedValue([[]]);
    jest.mocked(relationshipsQueryApi.getAnchors).mockResolvedValue([[]]);
    jest.mocked(relationshipsQueryApi.getResolved).mockResolvedValue([[]]);

    await httpRelationshipsQueryService.getSummary('source', { language: 'en' });
    await httpRelationshipsQueryService.getAnchors('source', 'file1', { language: 'es' });
    await httpRelationshipsQueryService.getResolved('source', { language: 'en' });

    expect(relationshipsQueryApi.getSummary).toHaveBeenCalledWith('source', 'en', undefined);
    expect(relationshipsQueryApi.getAnchors).toHaveBeenCalledWith(
      'source',
      'file1',
      'es',
      undefined
    );
    expect(relationshipsQueryApi.getResolved).toHaveBeenCalledWith('source', 'en', undefined);
  });
});
