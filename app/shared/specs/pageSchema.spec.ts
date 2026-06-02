import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { validatePage } from '#shared/types/pageSchema.js';
import { PageType } from '#shared/types/pageType.js';

describe('pageSchema', () => {
  let page: PageType;
  const templates = [
    {
      _id: db.id(),
      name: 'template',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      default: true,
      entityViewPage: 'share1',
    },
  ];
  describe('entity view page', () => {
    beforeEach(async () => {
      page = {
        title: 'Page 1',
        sharedId: 'share1',
        metadata: {
          content: '',
          script: '',
        },
        entityView: true,
      };

      await testingEnvironment.setUp({ templates });
    });

    afterAll(async () => {
      await testingEnvironment.tearDown();
    });

    it('should not allow to disable the entity view page when the page is in use by a template', async () => {
      expect.assertions(1);
      page.entityView = false;
      try {
        await validatePage(page);
      } catch (e) {
        expect(e.errors[0].message).toContain('This page is in use');
      }
    });

    it('should accept markdownSupport', async () => {
      page.markdownSupport = true;
      const validated = await validatePage(page);
      expect(validated.markdownSupport).toBe(true);
    });
  });
});
