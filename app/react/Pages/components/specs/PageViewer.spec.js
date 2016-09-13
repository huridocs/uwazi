import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import {PageViewer} from '../PageViewer';

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: fromJS({_id: 1, title: 'Page 1', metadata: {content: 'MarkdownContent'}})
    };
  });

  let render = () => {
    component = shallow(<PageViewer {...props} />, {context});
  };

  describe('render', () => {
    it('should render the page content', () => {
      render();
      expect(component.text()).toBe('Page 1');
      expect(component.find('.markdownViewer').props().dangerouslySetInnerHTML.__html).toContain('MarkdownContent');
    });
  });
});
