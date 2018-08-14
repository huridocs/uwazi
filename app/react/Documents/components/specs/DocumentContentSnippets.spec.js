import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';
import { browserHistory } from 'react-router';
import { DocumentContentSnippets } from '../SnippetList';

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<DocumentContentSnippets {...props}/>);
  };

  beforeEach(() => {
    spyOn(browserHistory, 'getCurrentLocation').and.returnValue({ pathname: 'path', query: { page: 1 } });
    props = {
      doc: Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      scrollToPage: jest.fn(),
      documentSnippets: Immutable.fromJS([
        { text: 'first <b>snippet 1</b> found', page: 1 },
        { text: 'second <b>snippet 3</b> found', page: 2 },
        { text: 'third <b>snippet 3</b> found', page: 3 }
      ]),
    };
  });

  it('should render all document snippets', () => {
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });

  it('should scrollToPage when click on a snippet link', () => {
    props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' });
    props.scrollToPage = jest.fn();
    render();
    component.find(I18NLink).at(1).simulate('click');
    expect(props.scrollToPage).toHaveBeenCalledWith(2);
  });
});
