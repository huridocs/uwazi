/**
 * @jest-environment jsdom
 */

import { shallow, ShallowWrapper } from 'enzyme';
import React, { useState } from 'react';
import { fromJS } from 'immutable';
import { IImmutable } from 'shared/types/Immutable';
import { DropdownMenu, ILink } from '../DropdownMenu';

const links: ILink[] = [
  {
    title: 'title 1',
    url: '/some_url',
    sublinks: [
      {
        title: 'title 1',
        url: '/some_url',
      },
    ],
    type: 'group',
  },
];

jest.mock('react', () => {
  const originReact = jest.requireActual('react');
  const museState = jest.fn().mockReturnValueOnce([]);
  return {
    ...originReact,
    useState: museState,
  };
});

describe('DropdownMenu', () => {
  let component: ShallowWrapper;
  let immutableLinks: IImmutable<ILink[]>;
  const setShowing = jest.fn();
  const showing = false;

  beforeEach(() => {
    immutableLinks = fromJS(links);
    // @ts-ignore
    useState.mockReturnValueOnce([showing, setShowing]);
  });

  it('should render children', () => {
    component = shallow(<DropdownMenu link={immutableLinks.get(0)} position={1} />);
    expect(component.find('.dropdown-menu').children()).toHaveLength(1);
  });

  it('should open drowpown when clicked', () => {
    const mountComp = shallow(<DropdownMenu link={immutableLinks.get(0)} position={1} />);
    mountComp
      .find('li > a#navbarDropdownMenuLink')
      .first()
      .simulate('click');
    expect(setShowing).toBeCalledWith(true);
  });
  it('should have correct link ifthe link is internal', () => {
    const mountComp = shallow(<DropdownMenu link={immutableLinks.get(0)} position={1} />);
    expect(
      mountComp
        .find('ul')
        .children()
        .first()
        .children()
        .first()
        .prop('to')
    ).toBe('/some_url');
  });
  it('should have correct link ifthe link is external', () => {
    const externalLink = fromJS({
      title: 'title 1',
      url: '/some_url',
      sublinks: [
        {
          title: 'title 1',
          url: 'http://google.com',
        },
      ],
      type: 'group',
    });
    const mountComp = shallow(<DropdownMenu link={externalLink} position={1} />);
    expect(
      mountComp
        .find('ul')
        .children()
        .first()
        .children()
        .first()
        .prop('href')
    ).toBe('http://google.com');
  });
});
