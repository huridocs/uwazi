import db from 'api/utils/testing_db';
import templates from '../templates';
import { checkIfReindex } from '../reindex';
import fixtures, { templateToBeEditedId } from './fixtures';

describe('reindex', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('Not Reindex', () => {
    it('should not reindex if name has changed', async () => {
      const [template] = await templates.get({ _id: templateToBeEditedId });
      template.name = 'Updated name';

      const reindex = checkIfReindex(template);

      expect(reindex).toEqual(false);
    });
    it('should not reindex if color has changed', async () => {
      const [template] = templates.get({ _id: templateToBeEditedId });
      console.log(template);
      template.color = '#222222';

      const reindex = checkIfReindex(template);

      expect(reindex).toEqual(false);
    });
  });
});
