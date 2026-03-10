/**
 * @jest-environment jsdom
 */
import { store } from 'app/store';
import Immutable from 'immutable';
import blankState from '../blankState';

describe('blankState()', () => {
  describe('when there is no thesauris', () => {
    it('it should return true', () => {
      spyOn(store, 'getState').and.returnValue({ thesauris: [] });
      expect(blankState()).toBe(true);
    });
  });

  describe('when there is thesauris', () => {
    it('it should return true', () => {
      spyOn(store, 'getState').and.returnValue({
        thesauris: [Immutable.fromJS({ values: [{ a: 'a' }] })],
      });
      expect(blankState()).toBe(false);
    });
  });
});
