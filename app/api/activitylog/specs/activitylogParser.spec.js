import db from 'api/utils/testing_db';
import fixtures, { firstTemplate, nonExistentId } from './fixturesParser';
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

        it('should allow uploaded documents without template', async () => {
          const semanticData = await getSemanticData({ method: 'POST', url: '/api/documents', body: '{"title":"New Document"}' });
          expect(semanticData).toEqual(expect.objectContaining({ extra: 'of type (unassigned)' }));
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

    describe('route: /api/attachments/delete', () => {
      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await getSemanticData(
            { method: 'DELETE', url: '/api/attachments/delete', query: '{"attachmentId":"1234"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted attachment',
            name: '1234'
          });
        });
      });
    });

    describe('routes: /api/templates', () => {
      describe('method: POST', () => {
        it('should beautify as CREATE if no template id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/templates', body: '{"name":"Person","fields":[]}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'CREATE',
            description: 'Created template',
            name: 'Person'
          });
        });

        it('should beautify as UPDATE if no template id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/templates', body: '{"_id":"tmp123","name":"Person","fields":[]}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'UPDATE',
            description: 'Updated template',
            name: 'Person (tmp123)'
          });
        });
      });

      describe('method: POST setasdefault', () => {
        it('should beautify as UPDATE set default template', async () => {
          const id = firstTemplate.toString();
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/templates/setasdefault', body: `{"_id":"${id}"}` }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'UPDATE',
            description: 'Set default template',
            name: `Existing Template (${id})`
          });
        });

        it('should display the id as name if the template does not exist', async () => {
          const id = nonExistentId.toString();
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/templates/setasdefault', body: `{"_id":"${id}"}` }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'UPDATE',
            description: 'Set default template',
            name: id
          });
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await getSemanticData(
            { method: 'DELETE', url: '/api/templates', query: '{"_id":"tmp123"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted template',
            name: 'tmp123'
          });
        });
      });
    });

    describe('routes: /api/thesauris', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE if no thesaurus id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/thesauris', body: '{"name":"Things","values":[]}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'CREATE',
            description: 'Created thesaurus',
            name: 'Things'
          });
        });

        it('should beautify as UPDATE if not thesauris id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/thesauris', body: '{"_id":"thes123","name":"Things","values":[]}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'UPDATE',
            description: 'Updated thesaurus',
            name: 'Things (thes123)'
          });
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await getSemanticData(
            { method: 'DELETE', url: '/api/thesauris', query: '{"_id":"thes123"}' }
          );
  
          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted thesaurus',
            name: 'thes123'
          });
        });
      });
    });

    describe('routes: /api/relationtypes', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE if no id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/relationtypes', body: '{"name":"Rel"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'CREATE',
            description: 'Created relation type',
            name: 'Rel'
          });
        });

        it('should beautify as UPDATE if not id is found', async () => {
          const semanticData = await getSemanticData(
            { method: 'POST', url: '/api/relationtypes', body: '{"_id":"rel123","name":"Rel"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'UPDATE',
            description: 'Updated relation type',
            name: 'Rel (rel123)'
          });
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await getSemanticData(
            { method: 'DELETE', url: '/api/relationtypes', query: '{"_id":"rel123"}' }
          );

          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted relation type',
            name: 'rel123'
          });
        });
      });
    });
  });
});
