/**
 * @jest-environment jsdom
 */

import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
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

describe('DropdownMenu', () => {
  let component: ShallowWrapper;
  let immutableLinks: IImmutable<ILink[]>;
  let hideMobileMenuMock: Function;

  beforeEach(() => {
    immutableLinks = fromJS(links);
    hideMobileMenuMock = jest.fn();
    // @ts-ignore
  });

  it('should render children', () => {
    component = shallow(
      <DropdownMenu link={immutableLinks.get(0)} position={1} hideMobileMenu={hideMobileMenuMock} />
    );
    expect(component.find('.dropdown-menu').children()).toHaveLength(1);
  });

  it('should open drowpown when clicked', () => {
    const mountComp = shallow(
      <DropdownMenu link={immutableLinks.get(0)} position={1} hideMobileMenu={hideMobileMenuMock} />
    );
    expect(mountComp.find('ul').get(0).props.className).not.toContain('expanded');
    mountComp
      .find('li > button#navbarDropdownMenuLink')
      .first()
      .simulate('click', { stopPropagation: () => {} });
    expect(mountComp.find('ul').get(0).props.className).toContain('expanded');
    expect(hideMobileMenuMock).not.toBeCalled();
  });
  it('should have correct link if the link is internal', () => {
    const mountComp = shallow(
      <DropdownMenu link={immutableLinks.get(0)} position={1} hideMobileMenu={hideMobileMenuMock} />
    );
    expect(mountComp.find('.dropdown-item').first().prop('to')).toBe('/some_url');
  });

  it('should close the dropdown when an option is clicked', () => {
    const mountComp = shallow(
      <DropdownMenu link={immutableLinks.get(0)} position={1} hideMobileMenu={hideMobileMenuMock} />
    );
    mountComp
      .find('li > button#navbarDropdownMenuLink')
      .first()
      .simulate('click', { stopPropagation: () => {} });
    expect(mountComp.find('ul').get(0).props.className).toContain('expanded');
    mountComp
      .find('.dropdown-item')
      .first()
      .simulate('click', { stopPropagation: () => {} });
    expect(mountComp.find('ul').get(0).props.className).not.toContain('expanded');
    expect(hideMobileMenuMock).toBeCalled();
  });

  it('should have correct link if the link is external', () => {
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
    const mountComp = shallow(
      <DropdownMenu link={externalLink} position={1} hideMobileMenu={hideMobileMenuMock} />
    );
    const option = mountComp.find('.dropdown-item').first();
    expect(option.prop('href')).toBe('http://google.com');
    expect(mountComp.find('ul').get(0).props.className).not.toContain('expanded');
    option.simulate('click', { stopPropagation: () => {} });
  });
});
