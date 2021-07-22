import { Application } from 'express';
import request from 'supertest';
import qs from 'qs';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingDB } from 'api/utils/testing_db';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { searchRoutes } from '../routes';
import { permissionsLevelFixtures, users } from './permissionsFiltersFixtures';

describe('Metadata filters', () => {
  const app: Application = setUpApp(searchRoutes);
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(permissionsLevelFixtures, 'entities.v2.permissions');
  });

  afterAll(async () => testingDB.disconnect());

  describe('when filtering published: true', () => {
    it('', async () => {
      userFactory.mock(users.editorUser);
      const query = { filter: { metadata: { text: '', multiSelect: { and: ['', ''] } } } };
      //filter%5Bmetadata%5D%5Btext%5D=&filter%5Bmetadata%5D%5BmultiSelect%5D%5Band%5D%5B0%5D=&filter%5Bmetadata%5D%5BmultiSelect%5D%5Band%5D%5B1%5D=
      const query2 = {
        filter: { metadata: { text: '', multiSelect: { values: [], operator: 'and' } } },
      };
      //filter[metadata][text]=text&filter[metadata][multiselect][values][]=1&filter[metadata][multiselect][operator]=and
      //filter%5Bmetadata%5D%5Btext%5D=&filter%5Bmetadata%5D%5BmultiSelect%5D%5Boperator%5D=and
      const query3 = {
        filter: {
          'metadata.text': '',
          'metadata.multiSelect': { values: [], operator: 'and' },
          title: '',
        },
      };
      //filter%5Bmetadata.text%5D=&filter%5Bmetadata.multiSelect%5D%5Boperator%5D=and&filter%5Btitle%5D=
      console.log(qs.stringify(query3));
      // const query3 = {
      //   filter: { metadata: { text: '', values: [], operator: 'and' } },
      // };
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ title: 'entPublic1' }),
        expect.objectContaining({ title: 'entPublic2' }),
      ]);
    });
  });
});
