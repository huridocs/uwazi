import Immutable from 'immutable';

import {mapStateToProps} from '~/Thesauris/components/ThesauriForm.js';

describe('ThesauriForm', () => {
  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        thesauri: Immutable.fromJS({name: 'thesauri name', values: []})
      };
    });

    it('should map the thesauri to initialValues', () => {
      expect(mapStateToProps(state).initialValues).toEqual({name: 'thesauri name', values: []});
    });

    it('should map the fields', () => {
      expect(mapStateToProps(state).fields).toEqual(['name', 'values[].label', 'values[].id', '_id', '_rev']);
    });
  });
});
