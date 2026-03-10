import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { MetadataFieldSnippets } from '../SnippetList';

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<MetadataFieldSnippets {...props} />);
  };

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      fieldSnippets: Immutable.fromJS({
        field: 'metadata.summary',
        texts: ['metadata <b>snippet m1</b> found', 'metadata <b>snippet m2</b> found'],
      }),
      template: Immutable.fromJS({
        _id: 'template',
        properties: [{ name: 'summary', label: 'Summary' }],
      }),
    };
  });

  it('should render all metadata snippets with the field label as heading', () => {
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });
  it('should properly render title snippets with Title label as heading', () => {
    props.fieldSnippets = Immutable.fromJS(
      Immutable.fromJS({
        field: 'metadata.summary',
        texts: ['title <b>snippet m1</b> found', 'title <b>snippet m2</b> found'],
      })
    );
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });
});
