import { sanitizeDimensionsForSources } from '../sanitizeDimensionsForSources.js';

const sharedTemplates = [
  {
    _id: 'tpl-a',
    name: 'A',
    properties: [
      { name: 'edad', label: 'Edad', type: 'numeric' },
      { name: 'sexo', label: 'Sexo', type: 'select', content: 'th-sex' },
      { name: 'country', label: 'Country', type: 'select', content: 'th-country' },
    ],
  },
  {
    _id: 'tpl-b',
    name: 'B',
    properties: [
      { name: 'edad', label: 'Edad', type: 'numeric' },
      { name: 'sexo', label: 'Sexo', type: 'select', content: 'th-sex' },
      { name: 'country', label: 'Country', type: 'select', content: 'th-country' },
    ],
  },
];

describe('sanitizeDimensionsForSources', () => {
  it('should keep shared secondary dimensions when multiple sources are active', () => {
    const dimensions = sanitizeDimensionsForSources(
      [
        { property: 'sexo', propertyType: 'select' },
        { property: 'country', propertyType: 'select' },
      ],
      [
        { templateId: 'tpl-a', alias: 'a' },
        { templateId: 'tpl-b', alias: 'b' },
      ],
      sharedTemplates
    );

    expect(dimensions).toEqual([
      { property: 'sexo', propertyType: 'select' },
      { property: 'country', propertyType: 'select' },
    ]);
  });

  it('should drop the secondary dimension when it is not shared across sources', () => {
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

  it('should keep both dimensions for duplicate sources of the same template', () => {
    const dimensions = sanitizeDimensionsForSources(
      [
        { property: 'sexo', propertyType: 'select', sourceAlias: 'owners' },
        { property: 'country', propertyType: 'select', sourceAlias: 'owners' },
      ],
      [
        { templateId: 'tpl-a', alias: 'owners' },
        { templateId: 'tpl-a', alias: 'owners_2' },
      ],
      [sharedTemplates[0]!]
    );

    expect(dimensions).toEqual([
      { property: 'sexo', propertyType: 'select' },
      { property: 'country', propertyType: 'select' },
    ]);
  });
});
