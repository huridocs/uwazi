import {store} from 'app/store';
import Immutable from 'immutable';
import t from '../t';
import {missingTranslations} from '../t';
import I18NApi from '../I18NApi';

describe('t', () => {
  let state;

  beforeEach(() => {
    let dictionaries = [
      {
        locale: 'en',
        contexts: [
          {
            id: 'System',
            label: 'System',
            values: {
              Search: 'Search',
              confirmDeleteDocument: 'Are you sure you want to delete this document?',
              confirmDeleteEntity: 'Are you sure you want to delete this entity?'
            }
          }
        ]
      },
      {
        locale: 'es',
        contexts: [
          {
            id: 'System',
            label: 'System',
            values: {
              Search: 'Buscar',
              confirmDeleteDocument: '¿Esta seguro que quiere borrar este documento?'
            }
          }
        ]
      }
    ];

    state = {
      locale: 'es',
      translations: Immutable.fromJS(dictionaries),
      user: Immutable.fromJS({_id: 'abc'})
    };

    spyOn(store, 'getState').and.returnValue(state);
    spyOn(I18NApi, 'addEntry');
  });

  it('should return the translation', () => {
    expect(t('System', 'confirmDeleteDocument', 'Are you sure you want to delete this document?'))
    .toBe('¿Esta seguro que quiere borrar este documento?');
  });

  describe('when there is no translation', () => {
    it('should return the default text', () => {
      expect(t('System', 'confirmDeleteEntity', 'Are you sure you want to delete this entity?'))
      .toBe('Are you sure you want to delete this entity?');
    });
  });

  describe('only passing context and key', () => {
    it('should use it as default text', () => {
      expect(t('System', 'not translated', 'not translated'));
    });
  });

  describe('missingTranslations', () => {
    describe('add', () => {
      it('should add a translation if not exists for the System context', () => {
        missingTranslations.reset();
        t('System', 'non existent key');
        t('System', 'non existent key 2', 'new text');
        t('other context', 'key', 'value');

        expect(missingTranslations.translations.length).toBe(2);
        expect(missingTranslations.translations[0]).toEqual({contextId: 'System', key: 'non existent key', defaultValue: 'non existent key'});
        expect(missingTranslations.translations[1]).toEqual({contextId: 'System', key: 'non existent key 2', defaultValue: 'new text'});
      });
    });
  });
});
