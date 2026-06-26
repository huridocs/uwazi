import { sanitizeDimensionsForSources } from '../sanitizeDimensionsForSources.js';

describe('sanitizeDimensionsForSources', () => {
  it('should drop the secondary dimension when multiple sources are active', () => {
    const dimensions = sanitizeDimensionsForSources(
      [
        { property: 'edad', propertyType: 'numeric' },
        { property: 'sexo', propertyType: 'select' },
      ],
      [
        { templateId: 'tpl-a', alias: 'a' },
        { templateId: 'tpl-b', alias: 'b' },
      ],
      [
        { _id: 'tpl-a', name: 'A', properties: [{ name: 'edad', label: 'Edad', type: 'numeric' }] },
        { _id: 'tpl-b', name: 'B', properties: [{ name: 'edad', label: 'Edad', type: 'numeric' }] },
      ]
    );

    expect(dimensions).toEqual([{ property: 'edad', propertyType: 'numeric' }]);
  });
});
