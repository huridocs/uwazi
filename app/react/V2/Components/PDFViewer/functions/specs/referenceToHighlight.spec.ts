import { referenceToHighlight } from '../ReferenceToHighlight.js';

describe('referenceToHighlight', () => {
  it('returns undefined when there are no selection rectangles', () => {
    const reference = {
      reference: { selectionRectangles: [] },
      _id: '1',
      hub: '1',
      file: '1',
      targetEntity: {
        _id: '1',
        sharedId: '1',
        title: 'test',
        templateId: 't1',
        template: { _id: 't1', name: 'T', color: '#000000' },
      },
    };

    expect(referenceToHighlight(reference)).toBeUndefined();
  });

  // eslint-disable-next-line max-statements
  it('converts a reference with selectionRectangles into a Highlight object', () => {
    const reference = {
      _id: '1',
      hub: '1',
      file: '1',
      reference: {
        text: 'Selected text',
        selectionRectangles: [
          { page: '3', top: 10, left: 20, width: 30, height: 40 },
          { page: '3', top: 15, left: 25, width: 35, height: 45 },
          { page: '4', top: 5, left: 5, width: 10, height: 10 },
        ],
      },
      targetEntity: {
        _id: '1',
        sharedId: '1',
        title: 'test',
        templateId: 'tpl',
        template: { _id: 'tpl', name: 'Template', color: '#00FF00' },
      },
    };

    const highlight = referenceToHighlight(reference);

    expect(highlight).toEqual({
      3: [
        {
          key: '3',
          textSelection: {
            text: 'Selected text',
            selectionRectangles: [
              { top: 10, left: 20, width: 30, height: 40, regionId: '3' },
              { top: 15, left: 25, width: 35, height: 45, regionId: '3' },
            ],
          },
          color: '#00FF00',
        },
      ],
      4: [
        {
          key: '4',
          textSelection: {
            text: 'Selected text',
            selectionRectangles: [{ top: 5, left: 5, width: 10, height: 10, regionId: '4' }],
          },
          color: '#00FF00',
        },
      ],
    });
  });
});
