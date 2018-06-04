import React from 'react';
import { shallow } from 'enzyme';
import { Menu } from '../Menu';
import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';

describe('Menu', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: Immutable.fromJS({}),
      links: Immutable.fromJS([
        {_id: 1, url: 'internal_url', title: 'Internal url'},
        {_id: 2, url: 'http://external_url', title: 'External url'}
      ]),
      libraryFilters: Immutable.fromJS({
        properties: []
      }),
      uploadsFilters: Immutable.fromJS({
        properties: []
      })
    };
  });

  let render = () => {
    component = shallow(<Menu {...props} />);
  };

  it('Renders external and internal links', () => {
    render();

    const internalLink = component.find('.menuNav-list').first().find(I18NLink);
    expect(internalLink.length).toBe(1);
    expect(internalLink.props().to).toBe('internal_url');

    const externalLink = component.find('.menuNav-list').first().find('a');
    expect(externalLink.length).toBe(1);
    expect(externalLink.props().href).toBe('http://external_url');
    expect(externalLink.props().target).toBe('_blank');
  });
});
