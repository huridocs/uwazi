/**
 * @jest-environment jsdom
 */
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { TextReferencePointer } from '#V2/formatters/relationships/types.js';
import { syncPdfWithMarker } from '../relationshipHighlightUtils.js';

const anchor: TextReferencePointer = {
  type: 'textReference',
  entity: 'shared1',
  entityTitle: 'Source',
  entityTemplateId: 'template1',
  file: 'file1',
  text: 'Implementing agreement',
  selections: [{ page: 2, top: 10, left: 0, width: 10, height: 10 }],
};

const marker: RelationshipMarker = {
  _id: 'agreement',
  relationship: {
    _id: 'agreement',
    hub: 'hub',
    type: 'relA',
    from: anchor,
    to: {
      type: 'entity',
      entity: 'other',
      entityTitle: 'Other',
      entityTemplateId: 'template1',
    },
    relationTypeOnSelf: true,
  },
  target: { sharedId: 'other', title: 'Other', templateId: 'template1' },
  anchor,
};

const pdf = (): PDFControls => ({
  goToPage: jest.fn(),
  scrollToHighlight: jest.fn(),
  activateSnippet: jest.fn(),
  deactivateSnippet: jest.fn(),
  toggleHighlights: jest.fn(),
});

describe('relationship highlight when the document is hidden', () => {
  it('highlights the anchor once the document can paint', () => {
    const controller = pdf();
    let queued: (() => void) | undefined;
    syncPdfWithMarker(marker, () => '#faca15', {
      controller,
      paintHighlight: run => {
        queued = run;
      },
    });
    expect(controller.goToPage).toHaveBeenCalledWith(2);
    expect(controller.toggleHighlights).not.toHaveBeenCalled();
    queued?.();
    expect(controller.toggleHighlights).toHaveBeenCalledWith([
      expect.objectContaining({
        2: [expect.objectContaining({ color: '#faca15' })],
      }),
    ]);
  });
});
