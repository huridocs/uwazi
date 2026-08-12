/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { I18NLink } from '#app/I18N/index.js';
import { DocumentContentSnippets } from '../SnippetList.js';

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<DocumentContentSnippets {...props} />);
  };

  beforeEach(() => {
    props = {
      sharedId: 'sharedId',
      searchTerm: 'snippet',
      selectSnippet: jest.fn(),
      selectedSnippet: Immutable.fromJS({ text: 'first <b>snippet 1</b> found', page: 1 }),
      documentSnippets: Immutable.fromJS([
        { text: 'first <b>snippet 1</b> found', page: 1 },
        { text: 'second <b>snippet 3</b> found', page: 2 },
        { text: 'third <b>snippet 3</b> found', page: 3 },
      ]),
    };
  });

  it('should render all document snippets', () => {
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });

  it('should selectSnippet when click on a snippet link', () => {
    render();
    component.find(I18NLink).at(1).simulate('click');
    expect(props.selectSnippet).toHaveBeenCalledWith(
      2,
      Immutable.fromJS({ text: 'second <b>snippet 3</b> found', page: 2 })
    );
  });

  it('should link snippets to V2 deep-links when flag is on', () => {
    props.entityViewerV2 = true;
    render();
    expect(component.find(I18NLink).at(0).props().to).toBe(
      '/entity/sharedId#s=search&searchTerm=snippet&page=1'
    );
  });
});
