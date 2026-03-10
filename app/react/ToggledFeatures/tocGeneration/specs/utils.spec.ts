import Immutable from 'immutable';
import { processQuery } from 'app/Library/helpers/requestState';

describe('Library/Uploads processQuery()', () => {
  it('should add aggregateGeneratedToc if feature activated', () => {
    const params = { q: '(order:desc,sort:creationDate)' };
    const globalResources = {
      settings: {
        collection: Immutable.fromJS({ features: { tocGeneration: {} } }),
      },
    };
    const query = processQuery(params, globalResources, 'library');
    expect(query).toEqual({
      order: 'desc',
      sort: 'creationDate',
      aggregateGeneratedToc: true,
    });
  });
});
