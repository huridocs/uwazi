import React from 'react';
import {shallow} from 'enzyme';

import {LibraryMenu} from 'app/Library/components/LibraryMenu';
import {MenuButtons} from 'app/ContextMenu';
import Immutable from 'immutable';

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
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      filtersForm: {isBatman: {value: true}},
      templates: Immutable.fromJS([]),
      searchTerm: 'test',
      search: {sort: 'title'}
    };
  });

  describe('when there is a document selected', () => {
    it('should start editing it', () => {
      props.selectedDocument = Immutable.fromJS({_id: '123'});
      props.metadata = Immutable.fromJS({_id: '123'});

      render();
      component.find(MenuButtons.Main).simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalled();
    });
  });
});
