import translations from 'api/i18n/translations';
import settings from '../settings.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

import fixtures from './fixtures.js';
import db from 'api/utils/testing_db';

describe('settings', () => {
  beforeEach((done) => {
    spyOn(translations, 'updateContext').and.returnValue(Promise.resolve('ok'));
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('save()', () => {
    it('should save the settings', (done) => {
      let config = {site_name: 'My collection'};
      settings.save(config)
      .then(() => {
        return settings.save({custom: {customNested: 'data'}});
      })
      .then(() => {
        return settings.get();
      })
      .then((result) => {
        expect(result.site_name).toBe('My collection');
        expect(result.custom.customNested).toBe('data');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document', (done) => {
      let config = {site_name: 'New settings'};

      settings.save(config)
      .then((createdDocument) => {
        expect(createdDocument.site_name).toBe(config.site_name);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when has links', () => {
      it('should create a translation context for the links', (done) => {
        let config = {site_name: 'My collection', links: [{title: 'Page one'}]};
        settings.save(config)
        .then(() => {
          expect(translations.updateContext).toHaveBeenCalledWith('Menu', 'Menu', {}, [], {'Page one': 'Page one'});
          done();
        })
        .catch(catchErrors(done));
      });

      describe('updating the links', () => {
        it('should update the translation context for the links', (done) => {
          let config = {site_name: 'My collection', links: [{title: 'Page one'}, {title: 'Page two'}]};
          settings.save(config)
          .then((savedConfig) => {
            config = {site_name: 'My collection', links: [{title: 'Page 1', _id: savedConfig.links[0]._id}, {title: 'Page three'}]};
            return settings.save(config);
          })
          .then(() => {
            expect(translations.updateContext)
            .toHaveBeenCalledWith('Menu', 'Menu', {'Page one': 'Page 1'}, ['Page two'], {'Page 1': 'Page 1', 'Page three': 'Page three'});
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    describe('when there are filter groups', () => {
      it('should create translations for them', (done) => {
        let config = {site_name: 'My collection', filters: [{id: 1, name: 'Judge'}, {id: 2, name: 'Documents', items: [{id: 3, name: 'Cause'}]}]};
        settings.save(config)
        .then(() => {
          expect(translations.updateContext).toHaveBeenCalledWith('Filters', 'Filters', {}, [], {Documents: 'Documents'});
          done();
        })
        .catch(catchErrors(done));
      });

      it('should update them', (done) => {
        let config = {
          site_name: 'My collection',
          filters: [{id: '1', name: 'Judge'}, {id: '2', name: 'Documents', items: []}, {id: '3', name: 'Files', items: []}]
        };
        settings.save(config)
        .then(() => {
          config = {site_name: 'My collection', filters: [{id: '1', name: 'Judge'}, {id: '2', name: 'Important Documents', items: []}]};
          translations.updateContext.calls.reset();
          return settings.save(config);
        })
        .then(() => {
          expect(translations.updateContext)
          .toHaveBeenCalledWith('Menu', 'Menu', {}, [], {});
          expect(translations.updateContext)
          .toHaveBeenCalledWith('Filters', 'Filters', {Documents: 'Important Documents'}, ['Files'], {'Important Documents': 'Important Documents'});
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', (done) => {
        db.clear(['settings'], () => {
          settings.get()
          .then((result) => {
            expect(result).toEqual({});
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });
  });

  describe('removeTemplateFromFilters', () => {
    it('should remove the template from the filters', (done) => {
      let _settings = {
        filters: [
          {id: '123'},
          {
            id: 'axz',
            items: [{id: '123'}]
          }
        ]
      };
      spyOn(settings, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(settings, 'save');
      settings.removeTemplateFromFilters('123')
      .then(() => {
        expect(settings.save).toHaveBeenCalledWith({filters: [{id: 'axz', items: []}]});
        done();
      });
    });
  });
});
