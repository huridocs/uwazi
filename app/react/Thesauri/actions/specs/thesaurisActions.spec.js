import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';

import * as actions from 'app/Thesauri/actions/thesaurisActions';
import api from 'app/Thesauri/ThesauriAPI';

describe('thesaurisActions', () => {
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
