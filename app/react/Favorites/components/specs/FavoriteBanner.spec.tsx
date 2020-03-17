/**
 * @jest-environment jsdom
 */

import React from 'react';
import { shallow } from 'enzyme';

import FavoriteBanner, { FavoriteBannerProps } from '../FavoriteBanner';

const localStorageMock = (() => {
  let store: any = {};
  return {
    getItem: (key: string) => {
      return store[key];
    },
    setItem: (key: string, value: any) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Favorite Banner', () => {
  let component: Partial<React.Component>;
  let props: Partial<FavoriteBannerProps>;
  let mockEvent: any;

  const render = (passedProps: Partial<FavoriteBannerProps> = {}) => {
    const startingProps = {
      sharedId: 'sharedId2',
    };

    props = { ...startingProps, ...passedProps };
    component = shallow(<FavoriteBanner {...props} />);
  };

  beforeEach(() => {
    localStorageMock.setItem('uwaziFavorites', 'sharedId1,sharedId4');
    mockEvent = jasmine.createSpyObj('mockEvent', ['stopPropagation', 'preventDefault']);
  });

  it('should present a clickable banner', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should present a SELECTED banner if the current entity already in favorites', () => {
    render({ sharedId: 'sharedId4' });
    expect(component.find('button').props().className).toContain('selected');
  });

  it('should allow toggle-clicking the banner to add / remove to local storage', () => {
    render({ sharedId: 'newSharedId' });

    component.find('button').simulate('click', mockEvent);
    expect(localStorageMock.getItem('uwaziFavorites').split(',')).toContain('newSharedId');
    expect(component.find('button').props().className).toContain('selected');

    component.find('button').simulate('click', mockEvent);
    expect(localStorageMock.getItem('uwaziFavorites')).toBe('sharedId1,sharedId4');
    expect(component.find('button').props().className).not.toContain('selected');
  });
});
