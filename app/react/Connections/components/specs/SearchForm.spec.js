import React from 'react';
import { shallow } from 'enzyme';

import { SearchInput } from '#app/Layout/SearchInput.js';
import { SearchFormView } from '../SearchForm.js';

describe('SearchForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      search: jasmine.createSpy('search'),
      connectionType: 'basic',
    };
    component = shallow(<SearchFormView {...props} />);
  });

  describe('onChange', () => {
    it('should search passing target.value', () => {
      component.find(SearchInput).simulate('change', { target: { value: 'searchTerm' } });
      expect(props.search).toHaveBeenCalledWith('searchTerm', 'basic');
    });
  });
});
