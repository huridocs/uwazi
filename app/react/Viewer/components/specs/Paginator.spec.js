import { CurrentLocationLink } from 'app/Layout';
import React from 'react';

import { shallow } from 'enzyme';

import Paginator from '../Paginator';

describe('Paginator', () => {
  it('should render a previous button and next button based on the current page and total pages', () => {
    const props = {
      page: 5,
      totalPages: 25,
      baseUrl: 'url',
    };

    const component = shallow(<Paginator {...props} />);
    expect(component).toMatchSnapshot();
  });

  describe('when base Url already has the query string "?"', () => {
    it('should add the page number properly to the query string', () => {
      const props = {
        page: 3,
        totalPages: 25,
        baseUrl: 'url?param=value',
      };

      const component = shallow(<Paginator {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on first page', () => {
    it('should disable the prev link', () => {
      const props = {
        page: 1,
        totalPages: 25,
        baseUrl: 'url',
      };

      const component = shallow(<Paginator {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on last page', () => {
    it('should disable the next link', () => {
      const props = {
        page: 25,
        totalPages: 25,
        baseUrl: 'url',
      };

      const component = shallow(<Paginator {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when passing onPageChange callback', () => {
    it('should execute callback on prev/next passing the page selecte', () => {
      const props = {
        page: 5,
        totalPages: 25,
        baseUrl: 'url',
        onPageChange: jasmine.createSpy('onPageChange'),
      };

      const component = shallow(<Paginator {...props} />);

      component
        .find(CurrentLocationLink)
        .at(0)
        .simulate('click', { preventDefault: () => {} });
      expect(props.onPageChange).toHaveBeenCalledWith(4);

      component
        .find(CurrentLocationLink)
        .at(1)
        .simulate('click', { preventDefault: () => {} });
      expect(props.onPageChange).toHaveBeenCalledWith(6);
    });
  });
});
