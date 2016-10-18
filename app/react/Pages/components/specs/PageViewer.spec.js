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

  describe('Custom list markdown element', () => {
    it('should render the page content', () => {
      props.page = props.page.setIn(['metadata', 'content'],
        '## title\nSome text with a [URL](http://google.com) inside.' +
        '\n\n{list}(http://someurl:3000/es/?parameters=values)' +
        '\n\nWhich should be in its own line, separated with TWO line breaks (to create a new <p> Element)' +
        '\n\nAnd should allow multiple lists with different values' +
        '\n\n{list}(http://anotherurl:4000/es/?different=parameters)' +
        '\n\n{list}(http://anotherurl:5000/es/?a=b)' +
        '\n\n```javascript\nCode\n```'
      );
      render();
      expect(component.find('.markdownViewer').props().dangerouslySetInnerHTML.__html).toBe('joder');
    });
  });
});
