/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';
import { DocumentContentSnippets } from '../SnippetList';

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<DocumentContentSnippets {...props} />);
  };

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
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
    props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' });
    render();
    component.find(I18NLink).at(1).simulate('click');
    expect(props.selectSnippet).toHaveBeenCalledWith(
      2,
      Immutable.fromJS({ text: 'second <b>snippet 3</b> found', page: 2 })
    );
  });
});
