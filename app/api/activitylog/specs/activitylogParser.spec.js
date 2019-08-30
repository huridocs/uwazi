import db from 'api/utils/testing_db';
import fixtures, { firstTemplate } from './fixturesParser';
import { getSemanticData } from '../activitylogParser';

describe('Activitylog Parser', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('getSemanticData', () => {
    it('should report as beautified: false if no translation present for the route', async () => {
      const semanticData = await getSemanticData({ url: '/api/untraslated-route' });
      expect(semanticData.beautified).toBe(false);
    });

    describe('routes: /api/entities and /api/documents', () => {
      describe('method: POST', () => {
        it('should beautify as CREATE when no ID found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/entities', body: `{"title":"New Entity","template":"${firstTemplate.toString()}"}` }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'CREATE',
            description: 'Created entity / document',
            name: 'New Entity',
            extra: 'of type Existing Template'
          });
        });

        it('should beautify as UPDATE when ID found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/entities', body: `{"sharedId":"m0asd0","title":"Existing Entity","template":"${firstTemplate.toString()}"}` }
          );

          expect(semanticData).toEqual(expect.objectContaining({
            action: 'UPDATE',
            description: 'Updated entity / document',
            name: 'Existing Entity (m0asd0)',
          }));
        });

        it('should only report the template ID if no template found', async () => {
          const template = db.id();
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/documents', body: `{"title":"New Document","template":"${template.toString()}"}` }
          );

          expect(semanticData).toEqual(expect.objectContaining({ name: 'New Document', extra: `of type (${template.toString()})` }));
        });
      });

      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await getSemanticData(
            { method: 'DELETE', url: '/api/documents', query: '{"sharedId":"o9e07m5ni3h"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted entity / document',
            name: 'o9e07m5ni3h'
          });
        });
      });
    });
  });
});
