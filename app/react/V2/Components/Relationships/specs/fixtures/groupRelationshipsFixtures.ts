import { Selection } from '#V2/formatters/relationships/types.js';
import { RelationshipMarker } from '../../types.js';

const makeMarker = (
  _id: string,
  selections: Selection[] | null,
  templateId = 'template1',
  text = ''
): RelationshipMarker => {
  const from = selections
    ? ({
        type: 'textReference',
        entity: 'self',
        entityTitle: 'Self',
        entityTemplateId: 'template1',
        file: 'file1',
        text,
        selections,
      } as const)
    : ({
        type: 'entity',
        entity: 'self',
        entityTitle: 'Self',
        entityTemplateId: 'template1',
      } as const);

  return {
    _id,
    view: {
      _id,
      hub: `h-${_id}`,
      type: 'relType',
      from,
      to: {
        type: 'entity',
        entity: `t-${_id}`,
        entityTitle: `Target ${_id}`,
        entityTemplateId: templateId,
      },
      relationTypeOnSelf: false,
    },
    target: { sharedId: `t-${_id}`, title: `Target ${_id}`, templateId },
    anchor: from.type === 'textReference' ? from : undefined,
  };
};

const refPage1 = makeMarker('ref1', [{ page: 1, top: 10, left: 20, width: 100, height: 30 }]);
const refPage2 = makeMarker('ref2', [{ page: 2, top: 50, left: 20, width: 200, height: 30 }]);
const refMultipleRectangles = makeMarker('ref3', [
  { page: 1, top: 100, left: 20, width: 150, height: 30 },
  { page: 2, top: 10, left: 20, width: 200, height: 30 },
  { page: 2, top: 50, left: 20, width: 180, height: 30 },
]);
const refPage1Another = makeMarker(
  'ref4',
  [{ page: 1, top: 200, left: 50, width: 120, height: 25 }],
  'template2'
);
const refPage3 = makeMarker('ref5', [{ page: 3, top: 300, left: 100, width: 90, height: 20 }]);
const refNoRectangles = makeMarker('ref6', null);

export {
  makeMarker,
  refPage1,
  refPage2,
  refMultipleRectangles,
  refPage1Another,
  refPage3,
  refNoRectangles,
};
