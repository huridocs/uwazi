/** @format */

import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';

import * as actions from 'app/Thesauri/actions/thesaurisActions';
import { actions as formActions } from 'react-redux-form';
import api from 'app/Thesauri/ThesauriAPI';

describe('thesaurisActions', () => {
  describe('editThesaurus', () => {
    it('should set the thesauri in the form ', () => {
      const thesauri = { name: 'Secret list of things', values: [] };
      const dispatch = jasmine.createSpy('dispatch');
      spyOn(formActions, 'load');
      actions.editThesaurus(thesauri)(dispatch);

      expect(formActions.load).toHaveBeenCalledWith('thesauri.data', thesauri);
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      backend.restore();
      backend
        .delete(`${APIURL}thesauris?_id=thesauriId`, {
          body: JSON.stringify({ testBackendResult: 'ok' }),
        })
        .get(`${APIURL}templates/count_by_thesauri?_id=thesauriWithTemplates`, {
          body: JSON.stringify(2),
        })
        .get(`${APIURL}templates/count_by_thesauri?_id=thesauriWithoutTemplates`, {
          body: JSON.stringify(0),
        });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => backend.restore());

    describe('deleteThesauri', () => {
      it('should delete the thesauri and dispatch a thesauris/REMOVE action with the thesauri', done => {
        const thesauri = { _id: 'thesauriId' };
        actions
          .deleteThesaurus(thesauri)(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({ type: 'dictionaries/REMOVE', value: thesauri });
            done();
          });
      });
    });

    describe('checkThesauriCanBeDeleted', () => {
      it('should return a promise if the thesauri is NOT been use', done => {
        const data = { _id: 'thesauriWithoutTemplates' };
        actions
          .checkThesaurusCanBeDeleted(data)(dispatch)
          .then(() => {
            done();
          })
          .catch(() => {
            expect('Promise not to be rejected').toBe(false);
            done();
          });
      });

      it('should reject a promise if the thesauri IS been use', done => {
        const data = { _id: 'thesauriWithTemplates' };
        actions
          .checkThesaurusCanBeDeleted(data)(dispatch)
          .then(() => {
            expect('Promise to be rejected').toBe(false);
            done();
          })
          .catch(() => {
            done();
          });
      });
    });

    describe('reloadThesauris', () => {
      it('should set thesauris to new values', done => {
        spyOn(api, 'get').and.callFake(async () => Promise.resolve('thesaurisResponse'));
        actions
          .reloadThesauri()(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({
              type: 'thesauris/SET',
              value: 'thesaurisResponse',
            });
            done();
          });
      });
    });
  });
});
