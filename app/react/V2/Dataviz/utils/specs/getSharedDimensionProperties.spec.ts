import type { ClientPropertySchema } from '#app/istore.js';
import { getSharedDimensionProperties, propertiesMatchForDataviz } from '../getSharedDimensionProperties.js';

const select = (name: string, content: string): ClientPropertySchema => ({
  name,
  label: name,
  type: 'select',
  content,
});

const relationship = (
  name: string,
  content: string,
  relationType: string,
  inherit?: ClientPropertySchema['inherit']
): ClientPropertySchema => ({
  name,
  label: name,
  type: 'relationship',
  content,
  relationType,
  inherit,
});

describe('getSharedDimensionProperties', () => {
  it('should require matching thesaurus for select properties', () => {
    expect(propertiesMatchForDataviz(select('sexo', 'th-1'), select('sexo', 'th-1'))).toBe(true);
    expect(propertiesMatchForDataviz(select('sexo', 'th-1'), select('sexo', 'th-2'))).toBe(false);
  });

  it('should require matching relationship target and relation type', () => {
    expect(
      propertiesMatchForDataviz(
        relationship('pais', 'tpl-country', 'rel-1'),
        relationship('pais', 'tpl-country', 'rel-1')
      )
    ).toBe(true);
    expect(
      propertiesMatchForDataviz(
        relationship('pais', 'tpl-country', 'rel-1'),
        relationship('pais', 'tpl-country', 'rel-2')
      )
    ).toBe(false);
  });

  it('should return only properties shared across all sources', () => {
    const shared = getSharedDimensionProperties(
      [
        { templateId: 'tpl-a', alias: 'a' },
        { templateId: 'tpl-b', alias: 'b' },
      ],
      [
        {
          _id: 'tpl-a',
          name: 'A',
          properties: [
            select('sexo', 'th-sex'),
            select('country', 'th-country-a'),
            { name: 'edad', label: 'Edad', type: 'numeric' },
          ],
        },
        {
          _id: 'tpl-b',
          name: 'B',
          properties: [
            select('sexo', 'th-sex'),
            select('country', 'th-country-b'),
            { name: 'edad', label: 'Edad', type: 'numeric' },
          ],
        },
      ]
    );

    expect(shared.map(property => property.name)).toEqual(['sexo', 'edad']);
  });

  it('should exclude multidate, daterange, and multidaterange properties', () => {
    const properties = getSharedDimensionProperties(
      [{ templateId: 'tpl-a', alias: 'a' }],
      [
        {
          _id: 'tpl-a',
          name: 'A',
          properties: [
            { name: 'created', label: 'Created', type: 'date' },
            { name: 'dates', label: 'Dates', type: 'multidate' },
            { name: 'period', label: 'Period', type: 'daterange' },
            { name: 'periods', label: 'Periods', type: 'multidaterange' },
            relationship('mandates', 'tpl-b', 'rel-1', {
              property: 'start',
              type: 'multidate',
            }),
          ],
        },
      ]
    );

    expect(properties.map(property => property.name)).toEqual(['created']);
  });
});
