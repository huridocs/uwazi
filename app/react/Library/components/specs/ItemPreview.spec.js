import React from 'react';
import { shallow } from 'enzyme';
import MarkdownViewer from 'app/Markdown';
import Immutable from 'immutable';
import { ItemPreview } from '../ItemPreview';

describe('ItemPreview', () => {
  let component;
  let props;

  const entity = {
    metadata: {
      name: 'John',
      markdown: 'markdown value',
    }
  };
  const template = Immutable.fromJS({
    _id: '1',
    properties: [
      { name: 'markdown', type: 'markdown', preview: true }, { name: 'name', type: 'text' }
    ]
  });

  const render = () => {
    props = {
      template,
      entity,
    };
    component = shallow(<ItemPreview {...props} />);
  };

  beforeEach(render);

  describe('render()', () => {
    it('should render a MarkdownViewer with the preview prop', () => {
      render();
      const viewer = component.find(MarkdownViewer);
      expect(viewer.props().markdown).toBe('markdown value');
    });
  });
});
