/* eslint-disable max-lines */
/* eslint-disable max-statements */

import db from 'api/utils/testing_db';
import fixtures, {
  firstTemplate,
  firstDoc,
  firstDocSharedId,
  firstSemanticSearch,
  nonExistentId,
} from './fixturesParser';
import { getSemanticData } from '../activitylogParser';

describe('Activitylog Parser', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  async function testBeautified(log, expected) {
    const semanticData = await getSemanticData(log);
    expect(semanticData).toEqual({
      ...expected,
      beautified: true,
    });
  }

  describe('getSemanticData', () => {
    it('should report as beautified: false if no translation present for the route', async () => {
      const semanticData = await getSemanticData({ url: '/api/untraslated-route' });
      expect(semanticData.beautified).toBe(false);
    });

    describe('routes: /api/entities and /api/documents', () => {
      describe('method: POST', () => {
        it('should beautify as CREATE when no ID found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities',
              body: `{"title":"New Entity","template":"${firstTemplate.toString()}"}`,
            },
            {
              action: 'CREATE',
              description: 'Created entity / document',
              name: 'New Entity',
              extra: 'of type Existing Template',
            }
          );
        });

        it('should beautify as UPDATE when ID found', async () => {
          const semanticData = await getSemanticData({
            method: 'POST',
            url: '/api/entities',
            body: `{"sharedId":"m0asd0","title":"Existing Entity","template":"${firstTemplate.toString()}"}`,
          });

          expect(semanticData).toEqual(
            expect.objectContaining({
              action: 'UPDATE',
              description: 'Updated entity / document',
              name: 'Existing Entity (m0asd0)',
            })
          );
        });

        it('should only report the template ID if no template found', async () => {
          const template = db.id();
          const semanticData = await getSemanticData({
            method: 'POST',
            url: '/api/documents',
            body: `{"title":"New Document","template":"${template.toString()}"}`,
          });

          expect(semanticData).toEqual(
            expect.objectContaining({
              name: 'New Document',
              extra: `of type (${template.toString()})`,
            })
          );
        });

        it('should allow uploaded documents without template', async () => {
          const semanticData = await getSemanticData({
            method: 'POST',
            url: '/api/documents',
            body: '{"title":"New Document"}',
          });
          expect(semanticData).toEqual(expect.objectContaining({ extra: 'of type (unassigned)' }));
        });
      });

      describe('method: POST /pdfInfo', () => {
        it('should beautify as UPDATE and include document title', async () => {
          const body = {
            _id: firstDoc,
            sharedId: firstDocSharedId,
            pdfInfo: {},
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/documents/pdfInfo',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Processed document pdf',
              name: `My Doc (${firstDocSharedId})`,
              extra: 'Spanish (es) version',
            }
          );
        });

        it('should only include ids if document does not exist', async () => {
          const body = {
            _id: nonExistentId,
            sharedId: 'deleted doc',
            pdfInfo: {},
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/documents/pdfInfo',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Processed document pdf',
              name: 'deleted doc',
            }
          );
        });
      });

      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/documents',
              query: '{"sharedId":"o9e07m5ni3h"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted entity / document',
              name: 'o9e07m5ni3h',
            }
          );
        });
      });

      describe('method: POST /multipleupdate', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities/multipleupdate',
              body: '{"ids":["id1","id2"],"values":{}}',
            },
            {
              action: 'UPDATE',
              description: 'Updated multiple entities',
            }
          );
        });
      });

      describe('method: POST /bulkdelete', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities/bulkdelete',
              body: '{"sharedIds":["id1","id2"]}',
            },
            {
              action: 'DELETE',
              description: 'Deleted multiple entities',
            }
          );
        });
      });
    });

    describe('route: /api/attachments', () => {
      describe('method: POST /upload', () => {
        it('should beautify as CREATE', async () => {
          testBeautified(
            {
              method: 'POST',
              url: '/api/attachments/upload',
              body: '{}',
              query: '{}',
            },
            {
              action: 'CREATE',
              description: 'Uploaded attachment',
            }
          );
        });
      });

      describe('method: DELETE /delete', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/attachments/delete',
              query: '{"attachmentId":"1234"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted attachment',
              name: '1234',
            }
          );
        });
      });

      describe('method: POST /rename', () => {
        it('should beautify as UPDATE and mention new name, entity and language', async () => {
          const body = {
            entityId: firstDoc.toString(),
            _id: 'attach1',
            originalname: 'New name',
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/attachments/rename',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Renamed attachment',
              name: 'New name (attach1)',
              extra: `of entity 'My Doc' (${firstDocSharedId}) Spanish (es) version`,
            }
          );
        });

        it('should only mention attachment new name and id if entity not found', async () => {
          const body = {
            entityId: nonExistentId.toString(),
            _id: 'attach1',
            originalname: 'New name',
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/attachments/rename',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Renamed attachment',
              name: 'New name (attach1)',
            }
          );
        });
      });
    });

    describe('routes: /api/templates', () => {
      describe('method: POST', () => {
        it('should beautify as CREATE if no template id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/templates',
              body: '{"name":"Person","fields":[]}',
            },
            {
              beautified: true,
              action: 'CREATE',
              description: 'Created template',
              name: 'Person',
            }
          );
        });

        it('should beautify as UPDATE if no template id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/templates',
              body: '{"_id":"tmp123","name":"Person","fields":[]}',
            },
            {
              beautified: true,
              action: 'UPDATE',
              description: 'Updated template',
              name: 'Person (tmp123)',
            }
          );
        });
      });

      describe('method: POST setasdefault', () => {
        it('should beautify as UPDATE set default template', async () => {
          const id = firstTemplate.toString();
          await testBeautified(
            {
              method: 'POST',
              url: '/api/templates/setasdefault',
              body: `{"_id":"${id}"}`,
            },
            {
              beautified: true,
              action: 'UPDATE',
              description: 'Set default template',
              name: `Existing Template (${id})`,
            }
          );
        });

        it('should display the id as name if the template does not exist', async () => {
          const id = nonExistentId.toString();
          await testBeautified(
            {
              method: 'POST',
              url: '/api/templates/setasdefault',
              body: `{"_id":"${id}"}`,
            },
            {
              beautified: true,
              action: 'UPDATE',
              description: 'Set default template',
              name: id,
            }
          );
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/templates',
              query: '{"_id":"tmp123"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted template',
              name: 'tmp123',
            }
          );
        });
      });
    });

    describe('routes: /api/thesauris', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE if no thesaurus id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/thesauris',
              body: '{"name":"Things","values":[]}',
            },
            {
              action: 'CREATE',
              description: 'Created thesaurus',
              name: 'Things',
            }
          );
        });

        it('should beautify as UPDATE if not thesauris id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/thesauris',
              body: '{"_id":"thes123","name":"Things","values":[]}',
            },
            {
              action: 'UPDATE',
              description: 'Updated thesaurus',
              name: 'Things (thes123)',
            }
          );
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/thesauris',
              query: '{"_id":"thes123"}',
            },
            {
              beautified: true,
              action: 'DELETE',
              description: 'Deleted thesaurus',
              name: 'thes123',
            }
          );
        });
      });
    });

    describe('routes: /api/relationtypes', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE if no id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/relationtypes',
              body: '{"name":"Rel"}',
            },
            {
              beautified: true,
              action: 'CREATE',
              description: 'Created relation type',
              name: 'Rel',
            }
          );
        });

        it('should beautify as UPDATE if not id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/relationtypes',
              body: '{"_id":"rel123","name":"Rel"}',
            },
            {
              action: 'UPDATE',
              description: 'Updated relation type',
              name: 'Rel (rel123)',
            }
          );
        });
      });

      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/relationtypes',
              query: '{"_id":"rel123"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted relation type',
              name: 'rel123',
            }
          );
        });
      });
    });

    describe('routes: /api/translations', () => {
      describe('method:POST', () => {
        it('should beautify as UPDATE and specify the language and the context updated', async () => {
          const data = {
            _id: 'txId',
            locale: 'en',
            contexts: [
              {
                _id: 'abcd',
                id: 'ctx123',
                label: 'ctxLbl',
                type: 'Connection',
                values: { wordKey: 'word value' },
              },
            ],
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations',
              body: JSON.stringify(data),
            },
            {
              action: 'UPDATE',
              description: 'Updated translations',
              name: 'in ctxLbl (ctx123)',
              extra: 'in English (en)',
            }
          );
        });

        it('should not specify contexts if more than one was changed', async () => {
          const data = {
            _id: 'txId',
            locale: 'en',
            contexts: [
              { id: 'ctx1', label: 'One' },
              { id: 'ctx2', label: 'Two' },
            ],
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations',
              body: JSON.stringify(data),
            },
            {
              action: 'UPDATE',
              description: 'Updated translations',
              name: 'in multiple contexts',
              extra: 'in English (en)',
            }
          );
        });
      });
      describe('method:DELETE /languages', () => {
        it('should beautify as DELETE with language name', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/translations/languages',
              query: '{"key":"de"}',
            },
            {
              action: 'DELETE',
              description: 'Removed language',
              name: 'German (de)',
            }
          );
        });
        it('should only display key if language name is unknown', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/translations/languages',
              query: '{"key":"abcd"}',
            },
            {
              action: 'DELETE',
              description: 'Removed language',
              name: 'abcd',
            }
          );
        });
      });
      describe('method:POST /setasdeafult', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations/setasdeafult',
              body: '{"key":"en"}',
            },
            {
              action: 'UPDATE',
              description: 'Set default language',
              name: 'English (en)',
            }
          );
        });
        it('should display only key if language name is unknown', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations/setasdeafult',
              body: '{"key":"unknown"}',
            },
            {
              action: 'UPDATE',
              description: 'Set default language',
              name: 'unknown',
            }
          );
        });
      });
      describe('method:POST /languages', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations/languages',
              body: '{"key":"de","label":"German"}',
            },
            {
              action: 'CREATE',
              description: 'Added language',
              name: 'German (de)',
            }
          );
        });
      });
    });

    describe('routes: /api/pages', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE when id is not provided', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/pages',
              body: '{"title":"Home","metadata":{"content":"foo"}}',
            },
            {
              action: 'CREATE',
              description: 'Created page',
              name: 'Home',
            }
          );
        });
        it('should beautify as UPDATE when id is provided', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/pages',
              body: '{"sharedId":"page123","title":"Home","metadata":{"content":"foo"}}',
            },
            {
              action: 'UPDATE',
              description: 'Updated page',
              name: 'Home (page123)',
            }
          );
        });
      });
      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/pages',
              query: '{"sharedId":"page123"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted page',
              name: 'page123',
            }
          );
        });
      });
    });

    describe('routes: /api/relationships', () => {
      describe('method:POST /bulk', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/relationships/bulk',
              body: '{"save":[],"delete":[]}',
            },
            {
              action: 'UPDATE',
              description: 'Updated relationships',
            }
          );
        });
      });
    });

    describe('routes: /api/users/new', () => {
      it('should beautify as CREATE', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/users/new',
            body: '{"username":"myuser","role":"editor"}',
          },
          {
            action: 'CREATE',
            description: 'Added new user',
            name: 'myuser',
            extra: 'with editor role',
          }
        );
      });
    });

    describe('routes /api/references', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE if id is not present', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/references',
              body: '{"template":"t1"}',
            },
            {
              action: 'CREATE',
              description: 'Created relationship',
            }
          );
        });
        it('should beautify as UPDATE if id is present', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/references',
              body: '{"_id":"ref1","template":"t1"}',
            },
            {
              action: 'UPDATE',
              description: 'Updated relationship',
              name: 'ref1',
            }
          );
        });
      });
      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          testBeautified(
            {
              method: 'DELETE',
              url: '/api/references',
              query: '{"_id":"ref1"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted relationship',
              name: 'ref1',
            }
          );
        });
      });
    });

    describe('routes: /api/settings', () => {
      it('should beautify as UPDATE', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/settings',
            body: '{"project":"test","filters":[]}',
          },
          {
            action: 'UPDATE',
            description: 'Updated settings',
          }
        );
      });
    });

    describe('routes: /api/semantic-search', () => {
      describe('method:POST', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/semantic-search',
              body: '{"searchTerm":"test"}',
            },
            {
              action: 'CREATE',
              description: 'Started semantic search',
              name: 'test',
            }
          );
        });
      });
      describe('method:DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/semantic-search',
              query: '{"searchId":"search1"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted semantic search',
              name: 'search1',
            }
          );
        });
      });
      describe('method:POST /stop', () => {
        it('should beautify as UPDATE and mention search term', async () => {
          const body = { searchId: firstSemanticSearch.toString() };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/semantic-search/stop',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Stopped semantic search',
              name: `foo (${firstSemanticSearch.toString()})`,
            }
          );
        });
        it('should only mention id if search no longer exists', async () => {
          const body = { searchId: nonExistentId.toString() };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/semantic-search/stop',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Stopped semantic search',
              name: nonExistentId.toString(),
            }
          );
        });
      });
      describe('method:POST /resume', () => {
        it('should beautify as UPDATE and mention search term', async () => {
          const body = { searchId: firstSemanticSearch.toString() };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/semantic-search/resume',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Resumed semantic search',
              name: `foo (${firstSemanticSearch.toString()})`,
            }
          );
        });
        it('should only mention id if search no longer exists', async () => {
          const body = { searchId: nonExistentId.toString() };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/semantic-search/resume',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Resumed semantic search',
              name: nonExistentId.toString(),
            }
          );
        });
      });
    });

    describe('routes: uploads', () => {
      describe('POST /api/upload', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/upload',
              body: '{}',
            },
            {
              action: 'CREATE',
              description: 'Uploaded document',
            }
          );
        });
      });
      describe('POST /api/reupload', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/reupload',
              body: '{}',
            },
            {
              action: 'UPDATE',
              description: 'Re-uploaded document',
            }
          );
        });
      });
      describe('POST /api/customisation/upload', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/customisation/upload',
              body: '{}',
            },
            {
              action: 'CREATE',
              description: 'Uploaded custom file',
            }
          );
        });
      });
      describe('DELETE /api/customisation/upload', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/customisation/upload',
              query: '{"_id":"file1"}',
            },
            {
              action: 'DELETE',
              description: 'Deleted custom file',
              name: 'file1',
            }
          );
        });
      });
      describe('POST /api/import', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/import',
              body: '{}',
            },
            {
              action: 'CREATE',
              description: 'Imported entities from file',
            }
          );
        });
      });
      describe('POST /api/public', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/public',
              body: '{}',
            },
            {
              action: 'CREATE',
              description: 'Created entity coming from a public form',
            }
          );
        });
      });
      describe('POST /api/remotepublic', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/remotepublic',
              body: '{}',
            },
            {
              action: 'CREATE',
              description: 'Submitted entity to a remote instance',
            }
          );
        });
      });
    });
  });
});
