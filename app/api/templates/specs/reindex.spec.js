import translations from 'api/i18n';
import { search } from 'api/search';
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { checkIfReindex } from '../reindex';
import templates from '../templates';
import fixtures, {
  pageSharedId,
  propertyToBeInherited2,
  templateInheritingFromAnother,
  templateWithContents,
} from './fixtures/fixtures';

const expectReindex = async (template, reindex) => {
  expect(await checkIfReindex(template)).toBe(reindex);
  await templates.save(template, 'en');
  expect(search.indexEntities).toHaveBeenCalledTimes(reindex ? 1 : 0);
};

describe('reindex', () => {
  beforeAll(async () => {
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    await db.setupFixturesAndContext(fixtures, 'reindex');
    jest.spyOn(search, 'indexEntities').mockReturnValue({});
  });

  beforeEach(() => {
    search.indexEntities.mockClear();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('Not Reindex', () => {
    it.each([
      { change: 'name has changed', templateChange: { name: 'Updated name' } },
      { change: 'entityViewPage has changed', templateChange: { entityViewPage: pageSharedId } },
      { change: 'color has changed', templateChange: { color: '#222222' } },
    ])('should not reindex if $change', async ({ templateChange }) => {
      let [template] = await templates.get({ _id: templateWithContents });
      template = {
        ...template,
        ...templateChange,
      };
      await expectReindex(template, false);
    });

    it('should not reindex synced template', async () => {
      const [template] = await templates.get({ _id: templateWithContents });
      const newTemplate = {
        ...template,
        synced: true,
        properties: template.properties.slice(1),
      };
      await templates.save(newTemplate, 'en');
      expect(search.indexEntities).toHaveBeenCalledTimes(0);
    });

    describe('Properties', () => {
      it.each([
        { change: 'use as filter is checked', propChange: { filter: true } },
        { change: 'default filter is checked', propChange: { defaultfilter: true } },
        { change: 'hide label is checked', propChange: { noLabel: true } },
        { change: 'show in card is checked', propChange: { showInCard: true } },
        { change: 'required property is checked', propChange: { required: true } },
        { change: 'image full width is checked', propChange: { fullWidth: true } },
        { change: 'image style is changed', propChange: { style: 'cover' } },
        { change: 'nested properties is changed', propChange: { nestedProperties: ['something'] } },
      ])('should not reindex if $change', async ({ propChange }) => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.properties[0] = { ...template.properties[0], ...propChange };
        await expectReindex(template, false);
      });

      it('should not find structural changes on unchanged inherit', async () => {
        const [template] = await templates.get({ _id: templateInheritingFromAnother });
        await expectReindex(template, false);
      });
    });
    describe('commonProperties', () => {
      it('should not reindex if priority sorting has changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.commonProperties[0].prioritySorting = true;
        await expectReindex(template, false);
      });
    });
  });

  describe('Reindex', () => {
    beforeAll(async () => {
      await db.setupFixturesAndContext(fixtures, 'reindex');
      jest.spyOn(search, 'indexEntities').mockReturnValue({});
    });

    beforeEach(() => {
      search.indexEntities.mockClear();
    });
    describe('Property', () => {
      it.each([
        {
          change: 'a property has been deleted',
          getProperties: props => props.slice(1),
        },
        {
          change: 'a property name has been changed',
          getProperties: props => [{ ...props[0], label: 'New property name' }, ...props.slice(1)],
        },
        {
          change: 'new property has been added',
          getProperties: props => props.concat([{ type: propertyTypes.text, label: 'text' }]),
        },
      ])('should reindex when $change', async ({ getProperties }) => {
        const [template] = await templates.get({ _id: templateWithContents });
        const newTemplate = {
          ...template,
          properties: getProperties(template.properties),
        };
        await expectReindex(newTemplate, true);
      });

      it('should find structural changes on changed inherit', async () => {
        const [inheritingTemplate] = await templates.get({ _id: templateInheritingFromAnother });
        inheritingTemplate.properties[0].inherit = {
          property: propertyToBeInherited2.toString(),
          type: 'text',
        };
        expect(await checkIfReindex(inheritingTemplate)).toBe(true);
      });
    });
    describe('commonProperty', () => {
      it('should reindex if commonProperty name has changed', async () => {
        const [template] = await templates.get({ _id: templateWithContents });
        template.commonProperties[0].label = 'Label Changed';
        await expectReindex(template, true);
      });
    });
  });
});
