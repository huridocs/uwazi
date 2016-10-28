import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {PageViewer} from '../PageViewer';
import {ItemList} from '../ItemList';

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: Immutable({_id: 1, title: 'Page 1', metadata: {content: 'MarkdownContent'}}),
      itemLists: Immutable([])
    };
  });

  let render = () => {
    component = shallow(<PageViewer {...props} />, {context});
  };

  describe('render', () => {
    it('should render the page content', () => {
      render();
      expect(component.find('.markdownViewer').props().dangerouslySetInnerHTML.__html).toContain('MarkdownContent');
    });
  });

  describe('Custom list markdown element', () => {
    beforeEach(() => {
      props.page = props.page.setIn(['metadata', 'content'],
        '## title\nSome text with a [URL](http://google.com) inside.' +
        '\n\n{---UWAZILIST---}' +
        '\n\nWhich should be in its own line, separated with TWO line breaks (to create a new <p> Element)' +
        '\n\nAnd should allow multiple lists with different values' +
        '\n\n{---UWAZILIST---}' +
        '\n\n{---UWAZILIST---}' +
        '\n\n```javascript\nCode\n```'
      );
    });

    it('should render the separated markdownViewer containers', () => {
      props.itemLists = Immutable([
        {params: 'param1', items: ['items1']},
        {params: 'param2', items: ['items2']},
        {params: 'param3', items: ['items3']}
      ]);

      render();
      expect(component.find('.markdownViewer').at(0).props().dangerouslySetInnerHTML.__html).toContain('title');
      expect(component.find('.markdownViewer').at(0).props().dangerouslySetInnerHTML.__html).toContain('Some text with a');

      expect(component.find('.markdownViewer').at(1).find(ItemList).props().link).toBe('/library/param1');
      expect(component.find('.markdownViewer').at(1).find(ItemList).props().items).toEqual(props.itemLists.getIn([0, 'items']).toJS());

      expect(component.find('.markdownViewer').at(2).props().dangerouslySetInnerHTML.__html).toContain('should be in its own line');
      expect(component.find('.markdownViewer').at(2).props().dangerouslySetInnerHTML.__html).toContain('should allow multiple lists');


      expect(component.find('.markdownViewer').at(3).find(ItemList).props().link).toBe('/library/param2');
      expect(component.find('.markdownViewer').at(3).find(ItemList).props().items).toEqual(props.itemLists.getIn([1, 'items']).toJS());

      expect(component.find('.markdownViewer').at(4).find(ItemList).props().link).toBe('/library/param3');
      expect(component.find('.markdownViewer').at(4).find(ItemList).props().items).toEqual(props.itemLists.getIn([2, 'items']).toJS());

      expect(component.find('.markdownViewer').at(5).props().dangerouslySetInnerHTML.__html).toContain('code');
    });

    it('should not fail if itemLists lenght is less (because of rendering empty or with props not loaded)', () => {
      props.itemLists = Immutable([
        {params: 'param1', items: ['items1']},
        {params: 'param3', items: ['items3']}
      ]);

      render();

      expect(component.find('.markdownViewer').at(3).find(ItemList).props().link).toBe('/library/param3');
      expect(component.find('.markdownViewer').at(3).find(ItemList).props().items).toEqual(props.itemLists.getIn([1, 'items']).toJS());

      expect(component.find('.markdownViewer').at(4).props().dangerouslySetInnerHTML.__html).toContain('code');
    });
  });
});
