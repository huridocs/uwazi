// @ts-expect-error TS(2307): Cannot find module '../api/utils/testing_db.js' or... Remove this comment to see the full error message
import db from 'api/utils/testing_db.js';
// @ts-expect-error TS(2307): Cannot find module '../api/utils/testingEnvironmen... Remove this comment to see the full error message
import { testingEnvironment } from 'api/utils/testingEnvironment.js';

// @ts-expect-error TS(2307): Cannot find module './types/pageSchema.js' or its ... Remove this comment to see the full error message
import { validatePage } from './types/pageSchema.js';
// @ts-expect-error TS(2307): Cannot find module './types/pageType.js' or its co... Remove this comment to see the full error message
import { PageType } from './types/pageType.js';

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
  });
});
