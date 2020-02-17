import { APIURL } from 'app/config.js';
import * as actions from 'app/Templates/actions/templatesActions';
import backend from 'fetch-mock';

describe('templatesActions', () => {
  describe('async actions', () => {
    let dispatch;
    beforeEach(() => {
      const documentsUsingTemplate = 2;
      backend.restore();
      backend
        .delete(`${APIURL}templates?_id=templateId`, {
          body: JSON.stringify({ testBackendResult: 'ok' }),
        })
        .post(`${APIURL}templates/setasdefault`, {
          body: JSON.stringify({ testBackendResult: 'ok' }),
        })
        .get(`${APIURL}documents/count_by_template?templateId=templateWithDocuments`, {
          body: JSON.stringify(documentsUsingTemplate),
        })
        .get(`${APIURL}templates/count_by_thesauri?_id=templateWithDocuments`, {
          body: JSON.stringify(0),
        })
        .get(`${APIURL}documents/count_by_template?templateId=templateAsThesauri`, {
          body: JSON.stringify(0),
        })
        .get(`${APIURL}templates/count_by_thesauri?_id=templateAsThesauri`, {
          body: JSON.stringify(1),
        })
        .get(`${APIURL}documents/count_by_template?templateId=templateWithoutDocuments`, {
          body: JSON.stringify(0),
        })
        .get(`${APIURL}templates/count_by_thesauri?_id=templateWithoutDocuments`, {
          body: JSON.stringify(0),
        });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => backend.restore());

    describe('checkTemplateCanBeDeleted', () => {
      it('should reject a promise if the template has documents', done => {
        const template = { _id: 'templateWithDocuments' };
        actions
          .checkTemplateCanBeDeleted(template)(dispatch)
          .then(() => {
            expect('Promise to be rejected').toBe(false);
            done();
          })
          .catch(() => {
            done();
          });
      });

      it('should reject a promise if the template is configured as thesauri', done => {
        const template = { _id: 'templateAsThesauri' };

        actions
          .checkTemplateCanBeDeleted(template)(dispatch)
          .then(() => {
            expect('Promise to be rejected').toBe(false);
            done();
          })
          .catch(() => {
            done();
          });
      });
    });

    describe('deleteTemplate', () => {
      it('should delete the template and dispatch a DELETE_TEMPLATE action with the template id', done => {
        const data = { _id: 'templateId' };
        actions
          .deleteTemplate(data)(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({ type: 'templates/REMOVE', value: data });
            done();
          });
      });
    });

    describe('setAsDefault', () => {
      it('should set the template as the default template', async () => {
        const data = { _id: 'default', name: 'My template' };
        await actions.setAsDefault(data)(dispatch);
        expect(JSON.parse(backend.lastOptions(`${APIURL}templates/setasdefault`).body)).toEqual({
          _id: 'default',
        });
      });
    });
  });
});
