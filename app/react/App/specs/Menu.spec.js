import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';
import { Menu } from '../Menu';

describe('Menu', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: Immutable.fromJS({}),
      links: Immutable.fromJS([
        { _id: 1, url: 'internal_url', title: 'Internal url' },
        { _id: 2, url: 'http://external_url', title: 'External url' },
        { _id: 3, url: undefined, title: 'undefined url' },
        { _id: 4, url: '/', title: 'single slash url' },
      ]),
      libraryFilters: Immutable.fromJS({
        properties: [],
      }),
      location: { query: { searchTerm: 'asd' } },
      uploadsFilters: Immutable.fromJS({
        properties: [],
      }),
    };
  });

  const render = () => {
    component = shallow(<Menu {...props} />);
  };

  it('Renders external and internal links', () => {
    render();

    const internalLink = component
      .find('.menuNav-list')
      .first()
      .find(I18NLink);
    expect(internalLink.length).toBe(3);
    expect(internalLink.at(0).props().to).toBe('internal_url');
    expect(internalLink.at(1).props().to).toBe('/');
    expect(internalLink.at(2).props().to).toBe('/');

    const externalLink = component
      .find('.menuNav-list')
      .first()
      .find('a');
    expect(externalLink.length).toBe(1);
    expect(externalLink.props().href).toBe('http://external_url');
    expect(externalLink.props().target).toBe('_blank');
  });
});
