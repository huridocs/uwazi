import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {PageViewer} from '../PageViewer';
import MarkdownViewer from 'app/Markdown';

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: Immutable({_id: 1, title: 'Page 1', metadata: {content: 'MarkdownContent'}}),
      itemLists: Immutable(['something'])
    };
  });

  let render = () => {
    component = shallow(<PageViewer {...props} />, {context});
  };

  describe('render', () => {
    it('should render a MarkdownViewer with the markdown and the items for the lists', () => {
      render();
      expect(component.find(MarkdownViewer).props().markdown).toBe('MarkdownContent');
      expect(component.find(MarkdownViewer).props().lists).toEqual(['something']);
    });
  });
});
