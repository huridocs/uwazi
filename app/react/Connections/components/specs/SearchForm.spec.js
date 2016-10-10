import React from 'react';
import {shallow} from 'enzyme';

import {SearchForm} from '../SearchForm';
import SearchInput from 'app/Layout/SearchInput';

describe('SearchForm', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      search: jasmine.createSpy('search')
    };
    component = shallow(<SearchForm {...props}/>);
    instance = component.instance();
  });

  describe('onChange', () => {
    it('should search passing target.value', () => {
      spyOn(instance, 'search');
      component.find(SearchInput).simulate('change', {target: {value: 'searchTerm'}});
      expect(instance.search).toHaveBeenCalledWith('searchTerm');
    });
  });

  describe('search', () => {
    it('should search passing term after 400 debounced ms', () => {
      jasmine.clock().install();
      instance.search('term');
      jasmine.clock().tick(400);

      expect(props.viewerSearch).toHaveBeenCalledWith('term');
      jasmine.clock().uninstall();
    });
  });
});
