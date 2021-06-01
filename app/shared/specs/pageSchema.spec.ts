import db from 'api/utils/testing_db';

import { validatePage } from 'shared/types/pageSchema';
import { PageType } from 'shared/types/pageType';

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

      await db.clearAllAndLoad({ templates });
    });

    afterAll(async () => {
      await db.disconnect();
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
  });
});
