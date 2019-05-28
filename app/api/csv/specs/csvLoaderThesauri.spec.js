import db from 'api/utils/testing_db';
import thesauris from 'api/thesauris';
import translations from 'api/i18n';
import settings from 'api/settings';

import CSVLoader from '../csvLoader';
import fixtures from './fixtures';
import { stream } from './helpers';

describe('csvLoader thesauri', () => {
  const loader = new CSVLoader();

  afterAll(async () => db.disconnect());

  let thesauriId;
  describe('load thesauri', () => {
    beforeAll(async () => {
      await db.clearAllAndLoad(fixtures);
      await translations.addLanguage('es');
      await settings.addLanguage({ key: 'es', label: 'spanish' });

      await translations.addLanguage('fr');
      await settings.addLanguage({ key: 'fr', label: 'french' });

      const nonExistent = 'Russian';

      const csv = `English, Spanish, French  , ${nonExistent}  ,
                   value 1, valor 1, valeur 1, 1               ,
                   value 2, valor 2, valeur 2, 2               ,
                   value 3, valor 3, valeur 3, 3               ,`;

      const { _id } = await thesauris.save({ name: 'thesauri2Id' });
      thesauriId = _id;
      await loader.loadThesauri(stream(csv), _id, { language: 'en' });
    });

    const getTranslation = async lang =>
      (await translations.get())
      .find(t => t.locale === lang)
      .contexts.find(c => c.id === thesauriId.toString()).values;

    it('should set thesauri values using the language passed', async () => {
      const thesauri = await thesauris.getById(thesauriId);
      expect(thesauri.values.map(v => v.label)).toEqual(['value 1', 'value 2', 'value 3']);
    });

    it('should translate thesauri values to english', async () => {
      const english = await getTranslation('en');

      expect(english['value 1']).toBe('value 1');
      expect(english['value 2']).toBe('value 2');
      expect(english['value 3']).toBe('value 3');
    });

    it('should translate thesauri values to spanish', async () => {
      const spanish = await getTranslation('es');

      expect(spanish['value 1']).toBe('valor 1');
      expect(spanish['value 2']).toBe('valor 2');
      expect(spanish['value 3']).toBe('valor 3');
    });

    it('should translate thesauri values to french', async () => {
      const french = await getTranslation('fr');

      expect(french['value 1']).toBe('valeur 1');
      expect(french['value 2']).toBe('valeur 2');
      expect(french['value 3']).toBe('valeur 3');
    });
  });

  // describe('on error', () => {
  //   it('should stop processing on the first error', async () => {
  //     const testingLoader = new CSVLoader();

  //     await db.clearAllAndLoad(fixtures);
  //     spyOn(entities, 'save').and.callFake(entity => Promise.reject(new Error(`error-${entity.title}`)));

  //     try {
  //       await testingLoader.load(csvFile, template1Id);
  //       fail('should fail');
  //     } catch (e) {
  //       expect(e).toEqual(new Error('error-title1'));
  //     }
  //   });
  // });
});
