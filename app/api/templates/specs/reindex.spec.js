import db from 'api/utils/testing_db';
import templates from '../templates';
import { checkIfReindex } from '../reindex';
import fixtures, { templateWithContents } from './fixtures';

describe('reindex', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures, 'reindex');
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('Not Reindex', () => {
    it('should not reindex if name has changed', async () => {
      const [template] = await templates.get({ _id: templateWithContents });
      template.name = 'Updated name';

      const reindex = await checkIfReindex(template);

      expect(reindex).toEqual(false);
    });
    it('should not reindex if color has changed', async () => {
      const [template] = await templates.get({ _id: templateWithContents });
      template.color = '#222222';

      const reindex = await checkIfReindex(template);

      expect(reindex).toEqual(false);
    });
    describe('Properties', () => {
      it('should not reindex if use as filter is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].filter = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if default filter is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].defaultfilter = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if hide label is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].noLabel = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if show in card is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].showInCard = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if required property is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].required = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if image full width is checked', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].fullWidth = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
      it('should not reindex if image style is changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].style = 'cover';

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
    });
    describe('commonProperties', () => {
      it('should not reindex if priority sorting has changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.commonProperties[0].prioritySorting = true;

        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(false);
      });
    });
  });

  describe('Reindex', () => {
    describe('Property', () => {
      it('should reindex if a property has been deleted', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties = [template.properties[1], template.properties[2]];
        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(true);
      });
      it('should reindex when a property name has been changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0].name = 'New property name';
        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(true);
      });
    });
    describe('commonProperty', () => {
      it('should reindex if a commonProperty has been deleted', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.commonProperties = [];
        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(true);
      });
      it('should reindex if commonProperty name has changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.commonProperties[0].name = 'New name';
        const reindex = await checkIfReindex(template);

        expect(reindex).toEqual(true);
      });
    });
  });
});
