import React from 'react';
import {shallow} from 'enzyme';

import {SearchButton} from 'app/Library/components/SearchButton';

describe('SearchButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = jasmine.createSpyObj(['hideFilters', 'showFilters']);
    props.open = true;
  });

  let render = function () {
    component = shallow(<SearchButton {...props}/>);
  };

  describe('when open', () => {
    it('should have active class', () => {
      render();
      expect(component.find('.is-active').length).toBe(1);
    });

    describe('onClick', () => {
      it('should hideFilters', () => {
        render();
        component.find('.search-button').simulate('click');
        expect(props.hideFilters).toHaveBeenCalled();
      });
    });
  });

  describe('when closed', () => {
    it('should not have active class', () => {
      props.open = false;
      render();
      expect(component.find('.is-active').length).toBe(0);
    });

    describe('onClick', () => {
      it('should showFilters', () => {
        props.open = false;
        render();
        component.find('.search-button').simulate('click');
        expect(props.showFilters).toHaveBeenCalled();
      });
    });
  });
});
