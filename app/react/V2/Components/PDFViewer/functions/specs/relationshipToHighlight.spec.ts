import { TextReferencePointer } from '#V2/formatters/relationships/types.js';
import { relationshipToHighlight } from '../RelationshipToHighlight.js';

describe('relationshipToHighlight', () => {
  it('returns undefined when there is no anchor', () => {
    expect(relationshipToHighlight(undefined, '#000000')).toBeUndefined();
  });

  it('returns undefined when the anchor has no selections', () => {
    const anchor: TextReferencePointer = {
      type: 'textReference',
      entity: 'e1',
      entityTitle: 'test',
      entityTemplateId: 't1',
      file: 'file1',
      text: '',
      selections: [],
    };

    expect(relationshipToHighlight(anchor, '#000000')).toBeUndefined();
  });
  it('converts a text reference anchor into a Highlight object', () => {
    const anchor: TextReferencePointer = {
      type: 'textReference',
      entity: 'e1',
      entityTitle: 'test',
      entityTemplateId: 'tpl',
      file: 'file1',
      text: 'Selected text',
      selections: [
        { page: 3, top: 10, left: 20, width: 30, height: 40 },
        { page: 3, top: 15, left: 25, width: 35, height: 45 },
        { page: 4, top: 5, left: 5, width: 10, height: 10 },
      ],
    };

    const highlight = relationshipToHighlight(anchor, '#00FF00');

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

  it('uses relationshipId as the highlight key when provided', () => {
    const anchor: TextReferencePointer = {
      type: 'textReference',
      entity: 'e1',
      entityTitle: 'test',
      entityTemplateId: 'tpl',
      file: 'file1',
      text: 'Selected text',
      selections: [{ page: 2, top: 10, left: 20, width: 30, height: 40 }],
    };

    const highlight = relationshipToHighlight(anchor, '#00FF00', 'rel-42');

    expect(highlight?.[2]?.[0]?.key).toBe('rel-42');
  });
});
