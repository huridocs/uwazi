"use strict";var _config = require("../../../config.js");
var actions = _interopRequireWildcard(require("../templatesActions"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('templatesActions', () => {
  describe('async actions', () => {
    let dispatch;
    beforeEach(() => {
      const documentsUsingTemplate = 2;
      _fetchMock.default.restore();
      _fetchMock.default.
      delete(`${_config.APIURL}templates?_id=templateId`, { body: JSON.stringify({ testBackendResult: 'ok' }) }).
      post(`${_config.APIURL}templates/setasdefault`, { body: JSON.stringify({ testBackendResult: 'ok' }) }).
      get(`${_config.APIURL}documents/count_by_template?templateId=templateWithDocuments`, { body: JSON.stringify(documentsUsingTemplate) }).
      get(`${_config.APIURL}templates/count_by_thesauri?_id=templateWithDocuments`, { body: JSON.stringify(0) }).
      get(`${_config.APIURL}documents/count_by_template?templateId=templateAsThesauri`, { body: JSON.stringify(0) }).
      get(`${_config.APIURL}templates/count_by_thesauri?_id=templateAsThesauri`, { body: JSON.stringify(1) }).
      get(`${_config.APIURL}documents/count_by_template?templateId=templateWithoutDocuments`, { body: JSON.stringify(0) }).
      get(`${_config.APIURL}templates/count_by_thesauri?_id=templateWithoutDocuments`, { body: JSON.stringify(0) });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => _fetchMock.default.restore());

    describe('checkTemplateCanBeDeleted', () => {
      it('should reject a promise if the template has documents', done => {
        const template = { _id: 'templateWithDocuments' };
        actions.checkTemplateCanBeDeleted(template)(dispatch).
        then(() => {
          expect('Promise to be rejected').toBe(false);
          done();
        }).
        catch(() => {
          done();
        });
      });

      it('should reject a promise if the template is configured as thesauri', done => {
        const template = { _id: 'templateAsThesauri' };

        actions.checkTemplateCanBeDeleted(template)(dispatch).
        then(() => {
          expect('Promise to be rejected').toBe(false);
          done();
        }).
        catch(() => {
          done();
        });
      });
    });

    describe('deleteTemplate', () => {
      it('should delete the template and dispatch a DELETE_TEMPLATE action with the template id', done => {
        const data = { _id: 'templateId' };
        actions.deleteTemplate(data)(dispatch).
        then(() => {
          expect(dispatch).toHaveBeenCalledWith({ type: 'templates/REMOVE', value: data });
          done();
        });
      });
    });

    describe('setAsDefault', () => {
      it('should set the template as the default template', async () => {
        const data = { _id: 'default', name: 'My template' };
        await actions.setAsDefault(data)(dispatch);
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}templates/setasdefault`).body)).toEqual({ _id: 'default' });
      });
    });
  });
});