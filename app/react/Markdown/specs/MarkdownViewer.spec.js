import React, {Component} from 'react';
import {shallow} from 'enzyme';
import CustomHookComponents from '../CustomHooks';
import CustomComponents from '../components';

import MarkdownViewer from '../MarkdownViewer';

describe('MarkdownViewer', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      markdown: 'MarkdownContent'
    };
  });

  let render = () => {
    component = shallow(<MarkdownViewer {...props} />);
  };

  describe('render', () => {
    it('should render the page content', () => {
      render();
      expect(component.find('div').at(1).props().dangerouslySetInnerHTML.__html).toContain('MarkdownContent');
    });
  });

  describe('Custom markdown elements', () => {
    beforeEach(() => {
      CustomHookComponents.validcomponent = class customComponent extends Component {
        render() {
          return <p>Custom</p>;
        }
      };

      props.lists = [
        {params: 'param1', items: ['items1'], options: {option1: 'optionValue'}},
        {params: 'param2', items: ['items2']},
        {params: 'param3', items: ['items3']}
      ];

      props.markdown =
        '## title\nSome text with a [URL](http://google.com) inside.' +
        '\n\n{list}(first list)' +
        '\n\nWhich should be in its own line, separated with TWO line breaks (to create a new <p> Element)' +
        '\n\nAnd should allow multiple lists with different values' +
        '\n\n{customhook}(component:validcomponent,prop:\'a prop\',array:!((child:!(a),bool:!t),(child:!(b))))' +
        '\n\nShould allow markdown between hooks' +
        '\n\n{customhook}(component:validcomponent)' +
        '\n\n{list}(http://secondList)(limit:3)' +
        '\n\n{customhook}(component:validcomponent)' +
        '\n\n{list}(asd)' +
        '\n\n{customhook}(component:invalidcomponent)' +
        '\n\n{vimeo}(1234, options)' +
        '\n\n{youtube}(1234)' +
        '\n\n```javascript\nCode\n```';
    });

    it('should render the markdown and the components', () => {
      render();
      expect(component.find(CustomHookComponents.validcomponent).at(0).props().prop).toBe('a prop');
      expect(component.find(CustomHookComponents.validcomponent).at(0).props().array).toEqual([{child: ['a'], bool: true}, {child: ['b']}]);
      expect(component.find(CustomComponents.MarkdownVimeo).props().config).toEqual('(1234, options)');
      expect(component.find(CustomComponents.MarkdownYoutube).props().config).toEqual('(1234)');
      expect(component.find(CustomComponents.ItemList).at(0).props().link).toBe('/library/param1');
      expect(component.find(CustomComponents.ItemList).at(0).props().items).toEqual(['items1']);
      expect(component.find(CustomComponents.ItemList).at(0).props().options).toEqual({option1: 'optionValue'});
    });
  });
});
