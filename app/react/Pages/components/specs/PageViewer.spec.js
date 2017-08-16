import React, {Component} from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import CustomHookComponents from 'app/CustomHooks';

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

  describe('Custom markdown elements', () => {
    beforeEach(() => {
      CustomHookComponents.validcomponent = class customComponent extends Component {
        render() {
          return <p>Custom</p>;
        }
      };

      props.page = props.page.setIn(['metadata', 'content'],
        '## title\nSome text with a [URL](http://google.com) inside.' +
        '\n\n{---UWAZILIST---}' +
        '\n\nWhich should be in its own line, separated with TWO line breaks (to create a new <p> Element)' +
        '\n\nAnd should allow multiple lists with different values' +
        '\n\n{customhook}(component:validcomponent,prop:\'a prop\')' +
        '\n\nShould allow markdown between hooks' +
        '\n\n{---UWAZILIST---}' +
        '\n\n{customhook}(component:validcomponent)' +
        '\n\n{---UWAZILIST---}' +
        '\n\n{customhook}(component:invalidcomponent)' +
        '\n\n```javascript\nCode\n```'
      );
    });

    it('should render the separated containers', () => {
      props.itemLists = Immutable([
        {params: 'param1', items: ['items1']},
        {params: 'param2', items: ['items2']},
        {params: 'param3', items: ['items3']}
      ]);

      render();
      expect(component.find('.pageSection').at(0).props().dangerouslySetInnerHTML.__html).toContain('title');
      expect(component.find('.pageSection').at(0).props().dangerouslySetInnerHTML.__html).toContain('Some text with a');

      expect(component.find('.pageSection').at(1).find(ItemList).props().link).toBe('/library/param1');
      expect(component.find('.pageSection').at(1).find(ItemList).props().items).toEqual(props.itemLists.getIn([0, 'items']).toJS());

      expect(component.find('.pageSection').at(2).props().dangerouslySetInnerHTML.__html).toContain('should be in its own line');
      expect(component.find('.pageSection').at(2).props().dangerouslySetInnerHTML.__html).toContain('should allow multiple lists');

      expect(component.find('.pageSection').at(3).props().className).toContain('customHook');

      expect(component.find('.pageSection').at(4).props().dangerouslySetInnerHTML.__html).toContain('markdown between hooks');

      expect(component.find('.pageSection').at(5).find(ItemList).props().link).toBe('/library/param2');
      expect(component.find('.pageSection').at(5).find(ItemList).props().items).toEqual(props.itemLists.getIn([1, 'items']).toJS());

      expect(component.find('.pageSection').at(6).props().className).toContain('customHook');

      expect(component.find('.pageSection').at(7).find(ItemList).props().link).toBe('/library/param3');
      expect(component.find('.pageSection').at(7).find(ItemList).props().items).toEqual(props.itemLists.getIn([2, 'items']).toJS());

      expect(component.find('.pageSection').at(8).props().className).toContain('customHook error');

      expect(component.find('.pageSection').at(9).props().dangerouslySetInnerHTML.__html).toContain('code');

      expect(component.find(CustomHookComponents.validcomponent).at(0).props())
      .toEqual({className: 'pageSection customHook', component: 'validcomponent', prop: 'a prop'});

      expect(component.find(CustomHookComponents.validcomponent).at(1).props())
      .toEqual({className: 'pageSection customHook', component: 'validcomponent'});

      expect(component.find('.customHook.error').at(0).text()).toContain('Custom Hook markup error');
    });

    it('should not fail if itemLists lenght is less (because of rendering empty or with props not loaded)', () => {
      props.itemLists = Immutable([
        {params: 'param1', items: ['items1']},
        {params: 'param3', items: ['items3']}
      ]);

      render();

      expect(component.find('.markdownViewer').at(4).find(ItemList).props().link).toBe('/library/param3');
      expect(component.find('.markdownViewer').at(4).find(ItemList).props().items).toEqual(props.itemLists.getIn([1, 'items']).toJS());

      expect(component.find('.markdownViewer').at(5).props().dangerouslySetInnerHTML.__html).toContain('code');
    });
  });
});
