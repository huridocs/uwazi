import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';

describe('RelationTypesAPI', () => {
  const arrayResponse = [{ name: 'test' }, { name: 'test2' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}relationtypes?param=value`, { body: JSON.stringify({ rows: arrayResponse }) })
      .delete(`${APIURL}relationtypes?_id=id`, {
        body: JSON.stringify({ backednResponse: 'testdelete' }),
      })
      .post(`${APIURL}relationtypes`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request relationTypes', async () => {
      const response = await relationTypesAPI.get(new RequestParams({ param: 'value' }));
      expect(response).toEqual(arrayResponse);
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /relationTypes', async () => {
      const data = { name: 'thesauri name', properties: [] };
      const response = await relationTypesAPI.save(new RequestParams(data));
      expect(JSON.parse(backend.lastOptions(`${APIURL}relationtypes`).body)).toEqual(data);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', async () => {
      const response = await relationTypesAPI.delete(new RequestParams({ _id: 'id' }));
      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });
});
