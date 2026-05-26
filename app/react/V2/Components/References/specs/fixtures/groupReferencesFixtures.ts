import { EntityReference } from '#V2/formatters/relationships/types.js';

const refPage1 = {
  _id: 'ref1',
  hub: 'hub1',
  file: 'file1',
  reference: {
    text: 'Text on page 1',
    selectionRectangles: [{ top: 10, left: 20, width: 100, height: 30, page: '1' }],
  },
  targetEntity: {
    _id: 'target1',
    sharedId: 'targetShared1',
    title: 'Target 1',
    templateId: 'template1',
  },
} as EntityReference;

const refPage2 = {
  _id: 'ref2',
  hub: 'hub2',
  file: 'file1',
  reference: {
    text: 'Text on page 2',
    selectionRectangles: [{ top: 50, left: 20, width: 200, height: 30, page: '2' }],
  },
  targetEntity: {
    _id: 'target2',
    sharedId: 'targetShared2',
    title: 'Target 2',
    templateId: 'template1',
  },
} as EntityReference;

const refMultipleRectangles = {
  _id: 'ref3',
  hub: 'hub3',
  file: 'file1',
  reference: {
    text: 'Text spanning pages 1 and 2',
    selectionRectangles: [
      { top: 100, left: 20, width: 150, height: 30, page: '1' },
      { top: 10, left: 20, width: 200, height: 30, page: '2' },
      { top: 50, left: 20, width: 180, height: 30, page: '2' },
    ],
  },
  targetEntity: {
    _id: 'target3',
    sharedId: 'targetShared3',
    title: 'Target 3',
    templateId: 'template1',
  },
} as EntityReference;

const refPage1Another = {
  _id: 'ref4',
  hub: 'hub4',
  file: 'file1',
  reference: {
    text: 'Another text on page 1',
    selectionRectangles: [{ top: 200, left: 50, width: 120, height: 25, page: '1' }],
  },
  targetEntity: {
    _id: 'target4',
    sharedId: 'targetShared4',
    title: 'Target 4',
    templateId: 'template2',
  },
} as EntityReference;

const refPage3 = {
  _id: 'ref5',
  hub: 'hub5',
  file: 'file1',
  reference: {
    text: 'Text on page 3',
    selectionRectangles: [{ top: 300, left: 100, width: 90, height: 20, page: '3' }],
  },
  targetEntity: {
    _id: 'target5',
    sharedId: 'targetShared5',
    title: 'Target 5',
    templateId: 'template1',
  },
} as EntityReference;

const refNoRectangles = {
  _id: 'ref6',
  hub: 'hub6',
  file: 'file1',
  reference: {
    text: 'Text without rectangles',
    selectionRectangles: [],
  },
  targetEntity: {
    _id: 'target6',
    sharedId: 'targetShared6',
    title: 'Target 6',
    templateId: 'template1',
  },
} as EntityReference;

export { refPage1, refPage2, refMultipleRectangles, refPage1Another, refPage3, refNoRectangles };
