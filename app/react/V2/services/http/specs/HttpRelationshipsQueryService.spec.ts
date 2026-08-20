/**
 * @jest-environment jsdom
 */
import { ApiError } from '#shared/apiClient/index.js';
import * as relationshipsQueryApi from '#V2/api/relationships/query.js';
import type {
  RelationshipAnchorRow,
  RelationshipResolvedRow,
  RelationshipSummaryRow,
} from '#V2/api/relationships/types.js';
import { httpRelationshipsQueryService } from '../HttpRelationshipsQueryService.js';

jest.mock('#V2/api/relationships/query.js', () => ({
  getSummary: jest.fn(),
  getAnchors: jest.fn(),
  getResolved: jest.fn(),
}));

const summary: RelationshipSummaryRow[] = [
  {
    _id: 'self',
    hub: 'h1',
    entity: 'source',
    template: null,
    file: 'file1',
    entityData: { title: 'Source', template: 't1' },
  },
  {
    _id: 'target',
    hub: 'h1',
    entity: 'other',
    template: 'relA',
    entityData: { title: 'Other', template: 't2' },
  },
];

const firstRect = { top: 1, left: 2, width: 3, height: 4, page: '1' };
const secondRect = { top: 5, left: 6, width: 7, height: 8, page: '2' };

const anchors: RelationshipAnchorRow[] = [
  { _id: 'self', reference: { selectionRectangles: [firstRect] } },
];

const resolved: RelationshipResolvedRow[] = [
  {
    _id: 'self',
    reference: { text: 'quote', selectionRectangles: [firstRect, secondRect] },
  },
];

describe('HttpRelationshipsQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loadSummary hits only getSummary', async () => {
    jest.mocked(relationshipsQueryApi.getSummary).mockResolvedValue([summary]);

    const [hubs] = await httpRelationshipsQueryService.loadSummary('source', { language: 'en' });

    expect(relationshipsQueryApi.getSummary).toHaveBeenCalledWith('source', 'en', undefined);
    expect(relationshipsQueryApi.getAnchors).not.toHaveBeenCalled();
    expect(relationshipsQueryApi.getResolved).not.toHaveBeenCalled();
    expect(hubs).toEqual(summary);
  });

  it('loadAnchors hits only getAnchors', async () => {
    jest.mocked(relationshipsQueryApi.getAnchors).mockResolvedValue([anchors]);

    const [rows] = await httpRelationshipsQueryService.loadAnchors('source', {
      language: 'es',
      fileId: 'file1',
    });

    expect(relationshipsQueryApi.getAnchors).toHaveBeenCalledWith(
      'source',
      'file1',
      'es',
      undefined
    );
    expect(relationshipsQueryApi.getSummary).not.toHaveBeenCalled();
    expect(relationshipsQueryApi.getResolved).not.toHaveBeenCalled();
    expect(rows).toEqual(anchors);
  });

  it('loadResolved hits only getResolved', async () => {
    jest.mocked(relationshipsQueryApi.getResolved).mockResolvedValue([resolved]);

    const [rows] = await httpRelationshipsQueryService.loadResolved('source', { language: 'en' });

    expect(relationshipsQueryApi.getResolved).toHaveBeenCalledWith('source', 'en', undefined);
    expect(relationshipsQueryApi.getSummary).not.toHaveBeenCalled();
    expect(relationshipsQueryApi.getAnchors).not.toHaveBeenCalled();
    expect(rows).toEqual(resolved);
  });

  it('compose overlays anchors and resolved without I/O', () => {
    expect(relationshipsQueryApi.getSummary).not.toHaveBeenCalled();
    expect(
      httpRelationshipsQueryService.compose(summary, { anchors, resolved })[0]?.reference
    ).toEqual({
      text: 'quote',
      selectionRectangles: [firstRect, secondRect],
    });
  });

  it('toViews maps composed hubs to relationship views', () => {
    const hubs = httpRelationshipsQueryService.compose(summary, { anchors, resolved });
    const views = httpRelationshipsQueryService.toViews('source', hubs);

    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({
      _id: 'target',
      hub: 'h1',
      type: 'relA',
      from: {
        type: 'textReference',
        entity: 'source',
        entityTitle: 'Source',
        entityTemplateId: 't1',
        file: 'file1',
        text: 'quote',
        selections: [
          { page: 1, top: 1, left: 2, width: 3, height: 4 },
          { page: 2, top: 5, left: 6, width: 7, height: 8 },
        ],
      },
      to: {
        type: 'entity',
        entity: 'other',
        entityTitle: 'Other',
        entityTemplateId: 't2',
      },
      relationTypeOnSelf: false,
    });
  });

  it('propagates non-404 errors from loadSummary', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    jest.mocked(relationshipsQueryApi.getSummary).mockResolvedValue([undefined, error]);

    await expect(
      httpRelationshipsQueryService.loadSummary('source', { language: 'en' })
    ).resolves.toEqual([undefined, error]);
  });

  it('propagates non-404 errors from loadAnchors', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    jest.mocked(relationshipsQueryApi.getAnchors).mockResolvedValue([undefined, error]);

    await expect(
      httpRelationshipsQueryService.loadAnchors('source', { language: 'en', fileId: 'file1' })
    ).resolves.toEqual([undefined, error]);
  });

  it('propagates non-404 errors from loadResolved', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    jest.mocked(relationshipsQueryApi.getResolved).mockResolvedValue([undefined, error]);

    await expect(
      httpRelationshipsQueryService.loadResolved('source', { language: 'en' })
    ).resolves.toEqual([undefined, error]);
  });
});
