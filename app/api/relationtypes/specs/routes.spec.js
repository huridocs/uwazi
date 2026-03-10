import relationtypesRoutes from 'api/relationtypes/routes.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import relationtypes from 'api/relationtypes/relationtypes';

describe('relationtypes routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => {
    resolve({ relationtypes: 'response' });
  });

  beforeEach(() => {
    routes = instrumentRoutes(relationtypesRoutes);
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should ask relationtypes for all documents', async () => {
      jest.spyOn(relationtypes, 'get').mockReturnValue(mockRequest);
      const response = await routes.get('/api/relationtypes', { query: {} });
      expect(relationtypes.get).toHaveBeenCalled();
      expect(response).toEqual({ rows: { relationtypes: 'response' } });
    });

    describe('when passing id', () => {
      it('should ask for the specific relationtype', async () => {
        jest.spyOn(relationtypes, 'getById').mockReturnValue(mockRequest);
        const response = await routes.get('/api/relationtypes', { query: { _id: 'someId' } });
        expect(relationtypes.getById).toHaveBeenCalledWith('someId');
        expect(response).toEqual({ rows: [{ relationtypes: 'response' }] });
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should delete the relationtype', async () => {
      jest.spyOn(relationtypes, 'delete').mockReturnValue(mockRequest);
      const response = await routes.delete('/api/relationtypes', {
        query: { _id: 'someId', _rev: 'latest' },
      });
      expect(relationtypes.delete).toHaveBeenCalledWith('someId');
      expect(response).toEqual({ relationtypes: 'response' });
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should save the relationtype', async () => {
      jest.spyOn(relationtypes, 'save').mockReturnValue(mockRequest);
      const response = await routes.post('/api/relationtypes', {
        body: { name: 'my new template' },
      });
      expect(relationtypes.save).toHaveBeenCalledWith({ name: 'my new template' });
      expect(response).toEqual({ relationtypes: 'response' });
    });
  });
});
