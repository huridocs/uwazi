import templates from 'app/Templates/TemplatesAPI';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';

describe('TemplatesAPI', () => {
  const mockResponse = [{ templates: 'array' }];
  const templateResponse = [{ template: 'single' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}templates`, { body: JSON.stringify({ rows: mockResponse }) })
      .get(`${APIURL}templates/count_by_thesauri?_id=id`, { body: JSON.stringify({ total: 1 }) })
      .get(`${APIURL}templates?_id=templateId`, {
        body: JSON.stringify({ rows: templateResponse }),
      })
      .delete(`${APIURL}templates?_id=id`, {
        body: JSON.stringify({ backednResponse: 'testdelete' }),
      })
      .post(`${APIURL}templates`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request templates', async () => {
      const response = await templates.get();
      expect(response).toEqual(mockResponse);
    });

    describe('when passing an id', () => {
      it('should request for the template', async () => {
        const response = await templates.get(new RequestParams({ _id: 'templateId' }));
        expect(response).toEqual(templateResponse);
      });
    });
  });

  describe('save()', () => {
    it('should post the template data to /templates', async () => {
      const data = { name: 'template name', properties: [] };
      const response = await templates.save(new RequestParams(data));
      expect(JSON.parse(backend.lastOptions(`${APIURL}templates`).body)).toEqual(data);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('delete()', () => {
    it('should delete the template', async () => {
      const data = { _id: 'id' };
      const response = await templates.delete(new RequestParams(data));
      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });

  describe('countByThesauri()', () => {
    it('should request the templates using a specific thesauri', async () => {
      const data = { _id: 'id' };
      const request = { data };
      const response = await templates.countByThesauri(request);
      expect(response).toEqual({ total: 1 });
    });
  });
});
