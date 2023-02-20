/**
 * @jest-environment jsdom
 */
import React from 'react';
import { CurrentLocationLink } from 'app/Layout';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { PaginatorWithPage as Paginator } from '../Paginator';

let page = 1;
const mockUseLocation = jest.fn().mockImplementation(() => ({
  search: `?page=${page}`,
}));

const mockUseSearchParams = jest.fn().mockImplementation(() => {
  const params = new Map();
  params.set('page', page);
  return [params];
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams(),
  useLocation: () => mockUseLocation(),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types
  Link: props => <a {...props} href={props.to} />,
}));

describe('Paginator', () => {
  const render = props => renderConnectedMount(Paginator, {}, props, true);
  it('should render a previous button and next button based on the current page and total pages', () => {
    page = 5;
    const props = {
      totalPages: 25,
      baseUrl: 'url',
    };

    const component = render(props);
    expect(component).toMatchSnapshot();
  });

  describe('when base Url already has the query string "?"', () => {
    it('should add the page number properly to the query string', () => {
      page = 3;
      const props = {
        totalPages: 25,
        baseUrl: 'url?param=value',
      };

      const component = render(props);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on first page', () => {
    it('should disable the prev link', () => {
      page = 1;
      const props = {
        totalPages: 25,
        baseUrl: 'url',
      };

      const component = render(props);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on last page', () => {
    it('should disable the next link', () => {
      page = 25;
      const props = {
        totalPages: 25,
        baseUrl: 'url',
      };
      const component = render(props);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when passing onPageChange callback', () => {
    it('should execute callback on prev/next passing the page selecte', () => {
      page = 5;
      const props = {
        totalPages: 25,
        baseUrl: 'url',
        onPageChange: jasmine.createSpy('onPageChange'),
      };

      const component = render(props);

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
