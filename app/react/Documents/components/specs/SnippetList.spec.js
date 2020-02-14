import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { SnippetList } from '../SnippetList';

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<SnippetList {...props} />);
  };

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      selectSnippet: jest.fn(),
      selectedSnippet: Immutable.fromJS({ text: 'first <b>snippet 1</b> found', page: 1 }),
      snippets: Immutable.fromJS({
        metadata: [
          {
            field: 'title',
            texts: ['metadata <b>snippet m1</b> found'],
          },
          {
            field: 'metadata.summary',
            texts: ['metadata <b>snippet m2</b>'],
          },
        ],
        fullText: [
          { text: 'first <b>snippet 1</b> found', page: 1 },
          { text: 'second <b>snippet 3</b> found', page: 2 },
          { text: 'third <b>snippet 3</b> found', page: 3 },
        ],
      }),
      template: Immutable.fromJS({
        _id: 'template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
          {
            name: 'summary',
            label: 'Summary',
          },
        ],
      }),
    };
  });

  it('should render metadata snippets and document content snippets components ', () => {
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
  it('should render only metadata snippets if there are no document snippets', () => {
    props.snippets = props.snippets.set('fullText', Immutable.fromJS([]));
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
  it('should render only document snippets if there are no metadata snippets', () => {
    props.snippets = props.snippets.set('metadata', Immutable.fromJS([]));
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
});
