import type { TextSelection } from '@huridocs/react-text-selection-handler';

const createWholeDocumentSelection = (page = '1'): TextSelection => ({
  text: '',
  selectionRectangles: [{ top: 0, left: 0, width: 1, height: 1, regionId: page }],
});

export { createWholeDocumentSelection };
