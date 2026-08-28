import { relationshipEntityValuesFromMetadata } from '../relationshipEntityValue.js';

describe('relationshipEntityValuesFromMetadata', () => {
  it('maps metadata values to relationship entity pills', () => {
    expect(
      relationshipEntityValuesFromMetadata(
        [
          { value: 'city-1', label: 'Quito' },
          { value: 'city-2', label: 'Guayaquil', type: 'city-tmpl' },
        ],
        { defaultTemplateId: 'fallback-tmpl', titleFallback: 'sharedId' }
      )
    ).toEqual([
      { _id: 'city-1', title: 'Quito', templateId: 'fallback-tmpl' },
      { _id: 'city-2', title: 'Guayaquil', templateId: 'city-tmpl' },
    ]);
  });

  it('prefers relation template ids over type and default', () => {
    expect(
      relationshipEntityValuesFromMetadata([{ value: 'e1', label: 'One', type: 'type-tmpl' }], {
        templateIds: new Map([['e1', 'rel-tmpl']]),
        titleFallback: 'empty',
      })
    ).toEqual([{ _id: 'e1', title: 'One', templateId: 'rel-tmpl' }]);
  });
});
