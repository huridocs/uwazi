import React from 'react';
import {shallow} from 'enzyme';

import {LibraryMenu} from 'app/Library/components/LibraryMenu';

describe('LibraryMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<LibraryMenu {...props}/>);
  };

  beforeEach(() => {
    props = {
      showFilters: jasmine.createSpy('showFilters'),
      searchDocuments: jasmine.createSpy('searchDocuments'),
      filtersForm: {isBatman: {value: true}},
      searchTerm: 'test',
      search: {sort: 'title'}
    };
  });

  describe('when filtersPanel is hidden', () => {
    it('should showFilters on click', () => {
      render();
      component.find('.float-btn__main').simulate('click');
      expect(props.showFilters).toHaveBeenCalled();
    });
  });
});
