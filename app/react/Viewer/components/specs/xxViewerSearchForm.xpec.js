import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSearchForm} from 'app/Viewer/components/ViewerSearchForm';
import SearchInput from 'app/Layout/SearchInput';

describe('ViewerSearchForm', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      viewerSearchDocuments: jasmine.createSpy('searchDocuments')
    };
    component = shallow(<ViewerSearchForm {...props}/>);
    instance = component.instance();
  });

  describe('onChange', () => {
    it('should searchDocuments passing target.value', () => {
      spyOn(instance, 'search');
      component.find(SearchInput).simulate('change', {target: {value: 'searchTerm'}});
      expect(instance.search).toHaveBeenCalledWith('searchTerm');
    });
  });

  describe('search', () => {
    it('should searchDocuments passing term after 400 debounced ms', () => {
      jasmine.clock().install();
      instance.search('term');
      jasmine.clock().tick(400);

      expect(props.viewerSearchDocuments).toHaveBeenCalledWith('term');
      jasmine.clock().uninstall();
    });
  });
});
