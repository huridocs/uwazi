import {store} from 'app/store';
import Immutable from 'immutable';
import t from '../t';

describe('t', () => {
  let state;

  beforeEach(() => {
    let dictionaries = [
      {
        locale: 'en',
        values: {
          Search: 'Search',
          confirmDeleteDocument: 'Are you sure you want to delete this document?',
          confirmDeleteEntity: 'Are you sure you want to delete this entity?'
        }
      },
      {
        locale: 'es',
        values: {
          Search: 'Buscar',
          confirmDeleteDocument: '¿Esta seguro que quiere borrar este documento?'
        }
      }
    ];

    state = {
      locale: 'es',
      dictionaries: Immutable.fromJS(dictionaries)
    };

    spyOn(store, 'getState').and.returnValue(state);
  });

  it('should return the translation', () => {
    expect(t('confirmDeleteDocument', 'Are you sure you want to delete this document?'))
    .toBe('¿Esta seguro que quiere borrar este documento?');
  });

  describe('when there is no translation', () => {
    it('should return the default text', () => {
      expect(t('confirmDeleteEntity', 'Are you sure you want to delete this entity?'))
      .toBe('Are you sure you want to delete this entity?');
    });
  });

  describe('only passing key', () => {
    it('should use it as default text', () => {
      expect(t('not translated', 'not translated'));
    });
  });
});
