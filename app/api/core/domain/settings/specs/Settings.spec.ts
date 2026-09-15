import { LanguageSchema } from '#shared/types/commonTypes.js';
import { LanguageNotFoundError, CannotDeleteDefaultLanguageError } from '../errors.js';
import { Settings } from '../Settings.js';

const english: LanguageSchema = { key: 'en', label: 'English', default: true };
const spanish: LanguageSchema = { key: 'es', label: 'Spanish' };

const withLanguages = (...languages: LanguageSchema[]) => new Settings({ languages });

describe('Settings', () => {
  describe('setDefaultLanguage()', () => {
    it('should mark exactly one language as default', () => {
      const settings = withLanguages(english, spanish);

      settings.setDefaultLanguage('es');

      expect(settings.languages).toEqual([
        { key: 'en', label: 'English', default: false },
        { key: 'es', label: 'Spanish', default: true },
      ]);
    });

    it('should throw when the key is not installed', () => {
      const settings = withLanguages(english);

      expect(() => settings.setDefaultLanguage('es')).toThrow(LanguageNotFoundError);
    });
  });

  describe('addLanguage()', () => {
    it('should append a language that is not already installed', () => {
      const settings = withLanguages(english);

      expect(settings.addLanguage(spanish)).toBe(true);
      expect(settings.languages?.map(language => language.key)).toEqual(['en', 'es']);
    });

    it('should skip a key that is already installed', () => {
      const settings = withLanguages(english, spanish);

      expect(settings.addLanguage({ key: 'es', label: 'Espanol' })).toBe(false);
      expect(settings.languages).toEqual([english, spanish]);
    });
  });

  describe('setLanguageInstalling()', () => {
    it('should set installing only on the targeted language', () => {
      const settings = withLanguages(english, spanish);

      settings.setLanguageInstalling('es', true);

      expect(settings.languages?.find(language => language.key === 'es')?.installing).toBe(true);
      expect(
        settings.languages?.find(language => language.key === 'en')?.installing
      ).toBeUndefined();
    });

    it('should throw when the key is not installed', () => {
      const settings = withLanguages(english);

      expect(() => settings.setLanguageInstalling('es', true)).toThrow(LanguageNotFoundError);
    });
  });

  describe('deleteLanguage()', () => {
    it('should remove a non-default language', () => {
      const settings = withLanguages(english, spanish);

      settings.deleteLanguage('es');

      expect(settings.languages).toEqual([english]);
    });

    it('should throw when deleting the default language', () => {
      const settings = withLanguages(english, spanish);

      expect(() => settings.deleteLanguage('en')).toThrow(CannotDeleteDefaultLanguageError);
      expect(settings.languages).toEqual([english, spanish]);
    });
  });

  describe('defaultLanguageKey()', () => {
    it('should return the default language key', () => {
      expect(withLanguages(english, spanish).defaultLanguageKey()).toBe('en');
    });
  });

  describe('filters', () => {
    it('should rename a filter by id and leave others unchanged', () => {
      const settings = new Settings({
        filters: [
          { id: '123', name: 'Batman' },
          { id: '456', name: 'Other' },
        ],
      });

      expect(settings.renameFilter('123', 'The dark knight')).toBe(true);
      expect(settings.filters).toEqual([
        { id: '123', name: 'The dark knight' },
        { id: '456', name: 'Other' },
      ]);
    });

    it('should return false when the filter id is missing', () => {
      const settings = new Settings({ filters: [{ id: '123', name: 'Batman' }] });

      expect(settings.renameFilter('missing', 'Nope')).toBe(false);
    });

    it('should drop a template from nested filter items', () => {
      const settings = new Settings({
        filters: [{ id: 'group', name: 'Group', items: [{ id: '123', name: 'Cases' }] }],
      });

      expect(settings.removeTemplateFromFilters('123')).toBe(true);
      expect(settings.filters).toEqual([{ id: 'group', name: 'Group', items: [] }]);
    });
  });

  describe('apply()', () => {
    it('should merge sparse incoming fields and keep omitted keys', () => {
      const settings = new Settings({
        site_name: 'Uwazi',
        customCSS: 'body {}',
        dateFormat: 'YYYY',
      });

      settings.apply({ site_name: 'Renamed' }, () => 'unused');

      expect(settings.site_name).toBe('Renamed');
      expect(settings.customCSS).toBe('body {}');
      expect(settings.dateFormat).toBe('YYYY');
    });

    it('should mint ids for links that do not have one', () => {
      const settings = new Settings({});
      let next = 0;

      settings.apply({ links: [{ title: 'Home', type: 'link', url: '/' }] }, () => {
        next += 1;
        return `id${next}`;
      });

      expect(settings.links).toEqual([{ id: 'id1', title: 'Home', type: 'link', url: '/' }]);
    });
  });

  describe('didEnableNewNameGeneration()', () => {
    it('should detect a false-to-true flip against the previous snapshot', () => {
      const previous = new Settings({});
      const settings = new Settings({ newNameGeneration: true });

      expect(settings.didEnableNewNameGeneration(previous)).toBe(true);
      expect(settings.didEnableNewNameGeneration(settings)).toBe(false);
    });
  });

  describe('deactivateSyncConfig()', () => {
    it('should disable the named active config and leave others', () => {
      const settings = new Settings({
        sync: [
          { name: 'peer', url: 'http://a', username: 'u', password: 'p', active: true, config: {} },
          {
            name: 'other',
            url: 'http://b',
            username: 'u',
            password: 'p',
            active: true,
            config: {},
          },
        ],
      });

      expect(settings.deactivateSyncConfig('peer')).toBe(1);
      expect(settings.sync?.[0].active).toBe(false);
      expect(settings.sync?.[1].active).toBe(true);
    });
  });
});
