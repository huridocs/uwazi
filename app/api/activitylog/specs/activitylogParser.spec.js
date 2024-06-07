/* eslint-disable max-lines */
/* eslint-disable max-statements */

import db from 'api/utils/testing_db';
import { fileId, groupId, suggestionId, userId } from 'api/activitylog/specs/fixturesParser';
import {
  fixtures,
  firstTemplate,
  firstDoc,
  firstDocSharedId,
  nonExistentId,
  extractorId,
} from './fixturesParser';
import { getSemanticData } from '../activitylogParser';
import * as activityLogBuilderExports from '../activityLogBuilder';
import { typeParsers } from '../migrationsParser';

jest.mock('../migrationsParser', () => ({
  typeParsers: {
    stubLogTypeParser: jest.fn(),
  },
}));

describe('Activitylog Parser', () => {
  beforeAll(async () => {
    typeParsers.stubLogTypeParser.mockReturnValue({
      action: 'MIGRATE',
      description: 'Dummy log',
    });
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  async function testBeautified(log, expected) {
    const semanticData = await getSemanticData(log);
    expect(semanticData).toEqual(expected);
  }

  describe('getSemanticData', () => {
    it('should report as RAW if no translation present for the route', async () => {
      const semanticData = await getSemanticData({ method: 'POST', url: '/api/untraslated-route' });
      expect(semanticData).toEqual({
        action: 'RAW',
        description: '',
        extra: 'POST: /api/untraslated-route',
      });
    });

    describe('routes: /api/entities and /api/documents', () => {
      describe('method: POST', () => {
        it('should beautify with body when it is a multipart request', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities',
              body: `{"entity":${JSON.stringify(`{"title":"New Entity","template":"${firstTemplate.toString()}"}`)}}`,
            },
            {
              action: 'CREATE',
              description: 'Created entity',
              name: 'New Entity',
              extra: 'of type Existing Template',
            }
          );
        });

        it('should beautify as CREATE when no ID found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities',
              body: `{"title":"New Entity","template":"${firstTemplate.toString()}"}`,
            },
            {
              action: 'CREATE',
              description: 'Created entity',
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
              description: 'Updated entity',
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

      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/documents',
              query: '{"sharedId":"o9e07m5ni3h"}',
              body: '{}',
            },
            {
              action: 'DELETE',
              description: 'Deleted entity',
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
              query: '{}',
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
              body: JSON.stringify({
                entity: firstDocSharedId,
              }),
              query: '{}',
            },
            {
              action: 'CREATE',
              description: 'Uploaded attachment',
              name: 'My Doc',
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
      describe('when POST a thesaurus data', () => {
        it('should beautify as CREATE if no thesaurus id is present in the body', async () => {
          const semanticData = await getSemanticData({
            method: 'POST',
            url: '/api/thesauris',
            body: '{"name":"Things","values":[]}',
          });
          expect(semanticData).toEqual({
            action: 'CREATE',
            description: 'Created thesaurus',
            name: 'Things',
          });
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
              action: 'DELETE',
              description: 'Deleted thesaurus',
              name: 'thes123',
            }
          );
        });
      });
    });

    describe('routes: /api/relationtypes', () => {
      describe('when POST a relationtype', () => {
        it('should beautify as CREATE if no id is found', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/relationtypes',
              body: '{"name":"Rel"}',
            },
            {
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

        it('should beautify as UPDATE and specify the context updated, with language key if it is unknown', async () => {
          const data = {
            _id: 'txId',
            locale: 'unknown',
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
              extra: 'in unknown',
            }
          );
        });

        it('should beautify as UPDATE at reset translation of a language', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/translations/populate',
              body: JSON.stringify({ locale: 'es' }),
            },
            {
              action: 'UPDATE',
              description: 'Reset default translation',
              extra: ' locale es ',
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
      describe('when POST a page', () => {
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
        it('should parse as CREATE if body does not have an id', async () => {
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

    describe('routes: /api/users', () => {
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

      it('should beautify as DELETE', async () => {
        await testBeautified(
          {
            method: 'DELETE',
            url: '/api/users',
            body: '{"ids":["userId1","userId2"]}',
          },
          {
            action: 'DELETE',
            description: 'Deleted multiple users',
          }
        );
      });

      it('should beautify as UPDATE', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/users',
            body: '{"_id":"userId", "username": "somename"}',
            idField: '_id',
            nameField: 'username',
          },
          {
            action: 'UPDATE',
            description: 'Updated user',
            name: 'somename (userId)',
          }
        );
      });

      describe('method: POST /api/users/unlock', () => {
        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/users/unlock',
              body: JSON.stringify({ _id: userId.toString() }),
            },
            {
              action: 'UPDATE',
              description: 'Unlocked account of user',
              name: 'User 1',
            }
          );
        });

        it('should not break on missing user', async () => {
          const missingIdString = db.id().toString();
          await testBeautified(
            {
              method: 'POST',
              url: '/api/users/unlock',
              body: JSON.stringify({ _id: missingIdString }),
            },
            {
              action: 'UPDATE',
              description: 'Unlocked account of user',
              name: missingIdString,
            }
          );
        });
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
              body: `{"entity":"{\\"title\\":\\"My entity\\",\\"template\\":\\"${firstTemplate.toString()}\\"}"}`,
            },
            {
              action: 'CREATE',
              description: 'Created entity coming from a public form',
              name: 'My entity',
              extra: 'of type Existing Template',
            }
          );
        });

        it('should beautify as CREATE, and report unassigned it template is not in db.', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/public',
              body: `{"entity":"{\\"title\\":\\"My entity\\",\\"template\\":\\"${nonExistentId.toString()}\\"}"}`,
            },
            {
              action: 'CREATE',
              description: 'Created entity coming from a public form',
              name: 'My entity',
              extra: 'of type (unassigned)',
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

      describe('POST /api/files/upload/custom', () => {
        it('should beautify as CREATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/files/upload/custom',
              body: JSON.stringify({
                entity: 'customUpload_22di2ga9o5q',
                originalname: 'file1.jpg',
              }),
            },
            {
              action: 'CREATE',
              description: 'Uploaded custom file',
              extra: ' originalname file1.jpg ',
            }
          );
        });
      });
    });

    describe('routes: /api/files', () => {
      describe('method: POST /api/files/upload/document', () => {
        it('should beautify as CREATE and include entity title', async () => {
          const body = {
            entity: firstDocSharedId,
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/files/upload/document',
              body: JSON.stringify(body),
            },
            {
              action: 'CREATE',
              description: 'Uploaded file',
              name: 'My Doc',
            }
          );
        });
      });

      describe('method: DELETE /api/files', () => {
        it('should beautify as DELETE', async () => {
          const body = {
            _id: 'attach1',
          };
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/files',
              body: JSON.stringify(body),
            },
            {
              action: 'DELETE',
              description: 'Deleted file',
              name: 'attach1',
            }
          );
        });
      });

      describe('method: POST /api/files', () => {
        it('should beautify as UPDATE with file name for toc changes', async () => {
          const body = {
            _id: fileId,
            toc: [{ range: { start: 9, end: 35 }, label: 'Content1' }],
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/files',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Updated file',
              name: 'ToC, My File',
            }
          );
        });
        it('should not break if file is missing from the database.', async () => {
          const body = {
            _id: nonExistentId,
            toc: [{ range: { start: 9, end: 35 }, label: 'Content1' }],
          };
          await testBeautified(
            {
              method: 'POST',
              url: '/api/files',
              body: JSON.stringify(body),
            },
            {
              action: 'UPDATE',
              description: 'Updated file',
              name: `ToC, id: ${nonExistentId.toString()}`,
            }
          );
        });
      });
    });

    describe('routes: /api/usergroups', () => {
      describe('method: POST api/usergroups', () => {
        it('should beautify as CREATE with extra members', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/usergroups',
              body: '{"name":"mygroup","members":[{"username":"User 1"}, {"username":"User 2"}]}',
            },
            {
              action: 'CREATE',
              description: 'Created user group',
              name: 'mygroup',
              extra: 'with members: User 1, User 2',
            }
          );
        });

        it('should beautify as CREATE without extra members', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/usergroups',
              body: '{"name":"mygroup","members":[]}',
            },
            {
              action: 'CREATE',
              description: 'Created user group',
              name: 'mygroup',
              extra: 'with no members',
            }
          );
        });

        it('should beautify as DELETE', async () => {
          await testBeautified(
            {
              method: 'DELETE',
              url: '/api/usergroups',
              body: '{"ids":["group1","group2"]}',
            },
            {
              action: 'DELETE',
              description: 'Deleted multiple user groups',
            }
          );
        });

        it('should beautify as UPDATE', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/usergroups',
              body: '{"_id": "group1", "name":"mygroup","members":[{"username":"User 1"}, {"username":"User 2"}]}',
              idField: '_id',
              nameField: 'username',
            },
            {
              action: 'UPDATE',
              description: 'Updated user group',
              name: 'mygroup (group1)',
              extra: 'with members: User 1, User 2',
            }
          );
        });
      });
    });

    describe('routes: /api/auth2fa', () => {
      it('should beautify as create enabling of 2fa', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/auth2fa-enable',
            body: '{"token": "1234"}',
          },
          {
            action: 'CREATE',
            description: 'Two-factor authentication enabled',
          }
        );
      });

      it('should beautify as create setting 2fa secret', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/auth2fa-secret',
          },
          {
            action: 'CREATE',
            description: 'Two-factor authentication secret',
          }
        );
      });
    });

    describe('routes: /api/entities/permissions', () => {
      describe('method: POST /api/entities/permissions', () => {
        it('should beautify as UPDATE with entities names and permissions as extra data', async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities/permissions',
              body: JSON.stringify({
                ids: [firstDocSharedId],
                permissions: [
                  { refId: groupId, type: 'group', level: 'read' },
                  { refId: userId, type: 'user', level: 'write' },
                  { refId: 'public', type: 'public', level: 'read' },
                ],
              }),
            },
            {
              action: 'UPDATE',
              description: 'Updated permissions on entity',
              name: 'My Doc',
              extra: ' with permissions for USERS: User 1 - write; GROUPS: Group 1 - read; PUBLIC',
            }
          );
        });

        it("should not break when user and group id's are missing", async () => {
          await testBeautified(
            {
              method: 'POST',
              url: '/api/entities/permissions',
              body: JSON.stringify({
                ids: [firstDocSharedId],
                permissions: [
                  { refId: nonExistentId, type: 'group', level: 'read' },
                  { refId: nonExistentId, type: 'user', level: 'write' },
                  { refId: 'public', type: 'public', level: 'read' },
                ],
              }),
            },
            {
              action: 'UPDATE',
              description: 'Updated permissions on entity',
              name: 'My Doc',
              extra: ` with permissions for USERS: ${nonExistentId.toString()} - write; GROUPS: ${nonExistentId.toString()} - read; PUBLIC`,
            }
          );
        });
      });
    });

    describe('routes: /api/suggestions/accept', () => {
      it('should beautify as UPDATE with entity title', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/suggestions/accept',
            body: JSON.stringify({
              allLanguages: true,
              suggestion: {
                _id: suggestionId,
                sharedId: firstDocSharedId.toString(),
                entityId: firstDoc,
              },
            }),
          },
          {
            action: 'UPDATE',
            description: 'Accepted suggestion on entity',
            name: 'doc1',
            extra:
              ' updated property: title on extractor extractor_name, with value: Red Robin . All languages: true',
          }
        );
      });
    });

    describe('routes: /api/suggestions/train', () => {
      it('should beautify as CREATE with the property name', async () => {
        await testBeautified(
          {
            method: 'POST',
            url: '/api/suggestions/train',
            body: JSON.stringify({
              extractorId: extractorId.toString(),
            }),
          },
          {
            action: 'CREATE',
            description: 'Information extraction training',
            extra: ' extractor extractor_name ',
          }
        );
      });
    });

    describe('MIGRATIONS logs', () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it('should delegate to migrationsParser if a parser exist for the log type', async () => {
        await testBeautified(
          {
            method: 'MIGRATE',
            url: '',
            body: JSON.stringify({
              type: 'stubLogTypeParser',
            }),
          },
          {
            action: 'MIGRATE',
            description: 'Dummy log',
          }
        );

        expect(typeParsers.stubLogTypeParser).toHaveBeenCalledWith({
          type: 'stubLogTypeParser',
        });
      });

      it('should report as RAW if a parser does NOT exist for the log type', async () => {
        const beautified = await getSemanticData({
          method: 'MIGRATE',
          url: '',
          body: JSON.stringify({
            type: 'nonExistentType',
          }),
        });
        expect(beautified).toEqual({ action: 'RAW' });
      });
    });

    describe('on any unhandled buildActivityEntry error', () => {
      it('should wrap the error and input in RAW.', async () => {
        jest.spyOn(activityLogBuilderExports, 'buildActivityEntry').mockImplementation(() => {
          throw Error;
        });
        const semanticData = await getSemanticData({
          method: 'POST',
          url: '/api/documents',
          body: '{"title":"New Document"}',
        });
        expect(semanticData).toEqual(
          expect.objectContaining({
            action: 'WARNING',
            description: 'The Activity log encountered an error in building the entry',
            extra: 'POST: /api/documents',
          })
        );
        activityLogBuilderExports.buildActivityEntry.mockRestore();
      });
    });
  });
});
