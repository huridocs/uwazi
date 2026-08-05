import type { DatavizQuery } from '#shared/types/datavizSchema.js';
import { validateQueryStructure } from '../validateExecutableDatavizQuery.js';

const baseQuery = (): DatavizQuery => ({
  sources: [
    { templateId: 'tpl-a', alias: 'owners' },
    { templateId: 'tpl-a', alias: 'owners_2' },
  ],
  join: { type: 'compare' },
  dimensions: [
    { property: 'sexo', propertyType: 'select' },
    { property: 'country', propertyType: 'select' },
  ],
  measures: [{ aggregation: 'count', countMode: 'all' }],
});

describe('validateQueryStructure', () => {
  it('should allow compare mode with two dimensions', () => {
    expect(() => validateQueryStructure(baseQuery())).not.toThrow();
  });

  it('should still reject relationship joins', () => {
    expect(() =>
      validateQueryStructure({
        ...baseQuery(),
        join: { type: 'relationship', relationshipProperty: 'rel' },
      })
    ).toThrow('Relationship joins are not supported yet');
  });
});
