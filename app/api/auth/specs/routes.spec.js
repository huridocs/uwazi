import authRoutes from '../routes';
import instrumentRoutes from '../../utils/instrumentRoutes';

describe('Auth Routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(authRoutes);
  });

  describe('/login', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/login')).toMatchSnapshot();
    });
  });
});
