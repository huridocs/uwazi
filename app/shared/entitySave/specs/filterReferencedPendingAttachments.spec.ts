import { filterReferencedPendingAttachments } from '../mediaMetadata.js';

describe('filterReferencedPendingAttachments', () => {
  it('keeps only pending attachments referenced by media metadata', () => {
    const pending = [
      { fileLocalID: 'keepMe', serializedFile: 'data:image/png;base64,a' },
      { fileLocalID: 'dropMe', serializedFile: 'data:image/png;base64,b' },
    ];
    expect(
      filterReferencedPendingAttachments(
        pending,
        [{ image: [{ value: 'keepMe' }], media: [{ value: '(otherId, {"timelinks":{}})' }] }],
        new Set(['image', 'media'])
      )
    ).toEqual([pending[0]]);
  });

  it('extracts upload ids from timelink media values', () => {
    const pending = [{ fileLocalID: 'clipId', serializedFile: 'data:video/mp4;base64,Y2xpcA==' }];
    expect(
      filterReferencedPendingAttachments(
        pending,
        [{ media: [{ value: '(clipId, {"timelinks":{"00:00:01":"intro"}})' }] }],
        new Set(['media'])
      )
    ).toEqual(pending);
  });

  it('unions upload ids across metadata bags', () => {
    const pending = [{ fileLocalID: 'a' }, { fileLocalID: 'b' }, { fileLocalID: 'c' }];
    expect(
      filterReferencedPendingAttachments(
        pending,
        [{ image: [{ value: 'a' }] }, { image: [{ value: 'b' }] }],
        new Set(['image'])
      )
    ).toEqual(pending.slice(0, 2));
  });
});
