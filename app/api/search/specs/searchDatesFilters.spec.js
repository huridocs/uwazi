import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import date from 'api/utils/date';

import elasticFixtures, { ids, fixturesTimeOut } from './fixtures_elastic';
import elastic from '../elastic';
import { instanceSearch } from '../search';

describe('dates filters search', () => {
  const elasticIndex = 'search_dates_index_test';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeAll(async () => {
    await db.clearAllAndLoad(elasticFixtures);
    await elasticTesting.reindex();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
  });

  it('should request all unpublished entities or documents for the user', async () => {
    spyOn(date, 'descriptionToTimestamp').and.returnValue('timestamp!');
    spyOn(elastic, 'search').and.returnValue(Promise.resolve({ hits: { hits: [] }, aggregations: { all: {} } }));

    await search.search(
      {
        types: [ids.template1],
        filters: {
          date: { to: 'dateto', from: 'datefrom' },
          multidate: { to: 'dateto', from: 'datefrom' },
          daterange: { to: 'dateto', from: 'datefrom' },
          multidaterange: { to: 'dateto', from: 'datefrom' },
        }
      },
      'en'
    );

    expect(elastic.search.calls.argsFor(0)[0].body.query.bool.filter[3]).toMatchSnapshot();
    expect(elastic.search.calls.argsFor(0)[0].body.query.bool.filter[4]).toMatchSnapshot();
    expect(elastic.search.calls.argsFor(0)[0].body.query.bool.filter[5]).toMatchSnapshot();
    expect(elastic.search.calls.argsFor(0)[0].body.query.bool.filter[6]).toMatchSnapshot();
  });
});
