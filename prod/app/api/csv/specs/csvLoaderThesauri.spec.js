"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _thesauris = _interopRequireDefault(require("../../thesauris"));
var _i18n = _interopRequireDefault(require("../../i18n"));
var _settings = _interopRequireDefault(require("../../settings"));

var _csvLoader = _interopRequireDefault(require("../csvLoader"));
var _fixtures = _interopRequireDefault(require("./fixtures"));
var _helpers = require("./helpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('csvLoader thesauri', () => {
  const loader = new _csvLoader.default();

  afterAll(async () => _testing_db.default.disconnect());

  let thesauriId;
  let result;
  describe('load thesauri', () => {
    beforeAll(async () => {
      await _testing_db.default.clearAllAndLoad(_fixtures.default);

      await _i18n.default.addLanguage('es');
      await _settings.default.addLanguage({ key: 'es', label: 'spanish' });

      await _i18n.default.addLanguage('fr');
      await _settings.default.addLanguage({ key: 'fr', label: 'french' });

      const { _id } = await _thesauris.default.save({ name: 'thesauri2Id', values: [{ label: 'existing value' }] });

      const nonExistent = 'Russian';

      const csv = `English, Spanish, French  , ${nonExistent}  ,
                   value 1, valor 1, valeur 1, 1               ,
                   value 2, valor 2, valeur 2, 2               ,
                   value 3, valor 3, valeur 3, 3               ,`;


      thesauriId = _id;
      result = await loader.loadThesauri((0, _helpers.stream)(csv), _id, { language: 'en' });
    });

    const getTranslation = async (lang) =>
    (await _i18n.default.get()).
    find(t => t.locale === lang).
    contexts.find(c => c.id === thesauriId.toString()).values;

    it('should set thesauri values using the language passed and ignore blank values', async () => {
      const thesauri = await _thesauris.default.getById(thesauriId);
      expect(thesauri.values.map(v => v.label)).toEqual(['existing value', 'value 1', 'value 2', 'value 3']);
    });

    it('should return the updated thesaurus', async () => {
      const thesaurus = await _thesauris.default.getById(thesauriId);
      expect(thesaurus).toEqual(result);
    });

    it('should translate thesauri values to english', async () => {
      const english = await getTranslation('en');

      expect(Object.keys(english).length).toBe(5);

      expect(english.thesauri2Id).toBe('thesauri2Id');
      expect(english['existing value']).toBe('existing value');
      expect(english['value 1']).toBe('value 1');
      expect(english['value 2']).toBe('value 2');
      expect(english['value 3']).toBe('value 3');
    });

    it('should translate thesauri values to spanish', async () => {
      const spanish = await getTranslation('es');

      expect(Object.keys(spanish).length).toBe(5);

      expect(spanish.thesauri2Id).toBe('thesauri2Id');
      expect(spanish['existing value']).toBe('existing value');
      expect(spanish['value 1']).toBe('valor 1');
      expect(spanish['value 2']).toBe('valor 2');
      expect(spanish['value 3']).toBe('valor 3');
    });

    it('should translate thesauri values to french', async () => {
      const french = await getTranslation('fr');

      expect(Object.keys(french).length).toBe(5);

      expect(french.thesauri2Id).toBe('thesauri2Id');
      expect(french['existing value']).toBe('existing value');
      expect(french['value 1']).toBe('valeur 1');
      expect(french['value 2']).toBe('valeur 2');
      expect(french['value 3']).toBe('valeur 3');
    });
  });
});