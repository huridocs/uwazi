import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import translations from 'api/i18n/translations';
import { Settings } from 'shared/types/settingsType';

import settings from '../settings';
import fixtures from './fixtures.js';

describe('settings', () => {
  beforeEach(done => {
    spyOn(translations, 'updateContext').and.returnValue(Promise.resolve('ok'));
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the settings', done => {
      const config = { site_name: 'My collection' };
      settings
        .save(config)
        .then(async () => settings.save({ custom: { customNested: 'data' } }))
        .then(async () => settings.get())
        .then(result => {
          expect(result.site_name).toBe('My collection');
          expect(result.custom.customNested).toBe('data');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should return the updated settings', done => {
      const config = { site_name: 'New settings' };

      settings
        .save(config)
        .then(createdDocument => {
          expect(createdDocument.site_name).toBe(config.site_name);
          expect(createdDocument.allowedPublicTemplates?.[0]).toBe('id1');
          expect(createdDocument.allowedPublicTemplates?.[1]).toBe('id2');
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when there are Links', () => {
      let config: Settings;

      beforeEach(() => {
        config = { site_name: 'My collection', links: [{ title: 'Page one' }] };
      });

      it('should create a translation context for the passed links', done => {
        settings
          .save(config)
          .then(() => {
            expect(translations.updateContext).toHaveBeenCalledWith(
              'Menu',
              'Menu',
              {},
              [],
              { 'Page one': 'Page one' },
              'Uwazi UI'
            );
            done();
          })
          .catch(catchErrors(done));
      });

      describe('updating the links', () => {
        it('should update the translation context for the links', done => {
          config.links = config.links || [];
          config.links.push({ title: 'Page two' });
          settings
            .save(config)
            .then(async savedConfig => {
              config = {
                site_name: 'My collection',
                links: [
                  { title: 'Page 1', _id: savedConfig.links?.[0]._id },
                  { title: 'Page three' },
                ],
              };
              return settings.save(config);
            })
            .then(() => {
              expect(translations.updateContext).toHaveBeenCalledWith(
                'Menu',
                'Menu',
                { 'Page one': 'Page 1' },
                ['Page two'],
                { 'Page 1': 'Page 1', 'Page three': 'Page three' },
                'Uwazi UI'
              );
              done();
            })
            .catch(catchErrors(done));
        });
      });
    });

    describe('when there are filter groups', () => {
      it('should create translations for them', done => {
        const config = {
          site_name: 'My collection',
          filters: [
            { id: '1', name: 'Judge' },
            { id: '2', name: 'Documents', items: [{ id: 3, name: 'Cause' }] },
          ],
        };
        settings
          .save(config)
          .then(() => {
            expect(translations.updateContext).toHaveBeenCalledWith(
              'Filters',
              'Filters',
              {},
              [],
              { Documents: 'Documents' },
              'Uwazi UI'
            );
            done();
          })
          .catch(catchErrors(done));
      });

      it('should update them', done => {
        let config = {
          site_name: 'My collection',
          filters: [
            { id: '1', name: 'Judge' },
            { id: '2', name: 'Documents', items: [] },
            { id: '3', name: 'Files', items: [] },
          ],
        };
        settings
          .save(config)
          .then(async () => {
            config = {
              site_name: 'My collection',
              filters: [
                { id: '1', name: 'Judge' },
                { id: '2', name: 'Important Documents', items: [] },
              ],
            };
            //@ts-ignore
            translations.updateContext.calls.reset();
            return settings.save(config);
          })
          .then(() => {
            expect(translations.updateContext).toHaveBeenCalledWith(
              'Filters',
              'Filters',
              { Documents: 'Important Documents' },
              ['Files'],
              { 'Important Documents': 'Important Documents' },
              'Uwazi UI'
            );
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when no links or filters are present', () => {
      it('should not update contexts translations', async () => {
        await settings.save({ custom: 'something that does not have links' });
        await translations.get();
        expect(translations.updateContext).not.toHaveBeenCalled();
      });
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', done => {
        //@ts-ignore
        db.clear(['settings'], () => {
          settings
            .get()
            .then(result => {
              expect(result).toEqual({});
              done();
            })
            .catch(catchErrors(done));
        });
      });
    });

    it('should not return private values', async () => {
      const values = await settings.get();
      expect(values.publicFormDestination).not.toBeDefined();
    });

    it('should return default values', async () => {
      const values = await settings.get();
      expect(values.mapTilerKey).toEqual('QiI1BlAJNMmZagsX5qp7');
    });

    describe('if there is settings with no default mapTilerKey on the DB', () => {
      it('should return the stored mapTilerKey', async () => {
        const expectedKey = 'anotherKey';
        const config = { mapTilerKey: expectedKey };
        await settings.save(config);
        const savedSettings = await settings.get();
        expect(savedSettings.mapTilerKey).toBe(expectedKey);
      });
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should save the settings with the new default language', done => {
      settings
        .setDefaultLanguage('en')
        .then(async () => settings.get())
        .then(result => {
          expect(result.languages?.[1].key).toBe('en');
          expect(result.languages?.[1].default).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('addLanguage()', () => {
    it('should add a to settings list language', done => {
      settings
        .addLanguage({ key: 'fr', label: 'Frances' })
        .then(async () => settings.get())
        .then(result => {
          expect(result.languages?.length).toBe(3);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('deleteLanguage()', () => {
    it('should add a to settings list language', done => {
      settings
        .deleteLanguage('en')
        .then(async () => settings.get())
        .then(result => {
          expect(result.languages?.length).toBe(1);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('removeTemplateFromFilters', () => {
    it('should remove the template from the filters', async () => {
      const _settings = {
        filters: [
          { id: '123' },
          {
            id: 'axz',
            items: [{ id: '123' }],
          },
        ],
      };
      spyOn(settings, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(settings, 'save');
      await settings.removeTemplateFromFilters('123');
      expect(settings.save).toHaveBeenCalledWith({ filters: [{ id: 'axz', items: [] }] });
    });
  });

  describe('updateFilterName', () => {
    const _settings = {
      filters: [{ id: '123', name: 'Batman' }],
    };

    it('should update a filter name', async () => {
      spyOn(settings, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(settings, 'save').and.returnValue(Promise.resolve('updatedSettings'));

      const updatedFilter = await settings.updateFilterName('123', 'The dark knight');

      expect(settings.save).toHaveBeenCalledWith({
        filters: [{ id: '123', name: 'The dark knight' }],
      });
      expect(updatedFilter).toEqual('updatedSettings');
    });

    it('should do nothing when filter does not exist', async () => {
      spyOn(settings, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(settings, 'save').and.returnValue(Promise.resolve('updatedSettings'));

      const updatedFilter = await settings.updateFilterName('321', 'Filter not present');

      expect(settings.save).not.toHaveBeenCalled();
      expect(updatedFilter).toBeUndefined();
    });
  });
});
