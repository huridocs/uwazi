import { catchErrors } from 'api/utils/jasmineHelpers';
import conctactRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import contact from '../contact';

describe('entities', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(conctactRoutes);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { name: 'Bruce Wayne', email: 'notbatman@wayne.com', text: 'I want to donate!' },
        language: 'lang',
      };
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/contact')).toMatchSnapshot();
    });

    it('should send an email', done => {
      spyOn(contact, 'sendMessage').and.returnValue(Promise.resolve());
      routes
        .post('/api/contact', req)
        .then(() => {
          expect(contact.sendMessage).toHaveBeenCalledWith(req.body);
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
