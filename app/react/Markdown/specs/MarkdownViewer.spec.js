import React, { Component } from 'react';

import { shallow } from 'enzyme';

import CustomHookComponents from '../CustomHooks';
import MarkdownViewer from '../MarkdownViewer';

describe('MarkdownViewer', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      markdown: '## MarkdownContent'
    };
  });

  const render = () => {
    component = shallow(<MarkdownViewer {...props} />);
  };

  describe('render', () => {
    describe('when markdown is empty', () => {
      it('should not render anything', () => {
        props.markdown = '';

        render();
        expect(component).toMatchSnapshot();
      });
    });

    it('should render markdown', () => {
      props.markdown = `## title\nSome text with a [URL](http://google.com) inside.
        \n\nWhich should be in its own line, separated with TWO line breaks (to create a new <p> Element)
        \n\n\`\`\`javascript\nCode\n\`\`\`
      `;

      render();
      expect(component).toMatchSnapshot();
    });

    it('should support containers with custom classNames', () => {
      props.markdown = '::: test classname \ntext inside a div';

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render media components', () => {
      props.markdown = `{vimeo}(1234, options)
      \n\n{youtube}(1234)
      \n\n{media}(config options)
      `;

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render list components', () => {
      props.lists = [
        { params: 'param1', items: ['items1'], options: { option1: 'optionValue' } },
        { params: 'param2', items: ['items2'] },
        { params: 'param3', items: ['items3'] }
      ];

      props.markdown = `{list}(first list)
        \n\n{list}(http://secondList)(limit:3)
        \n\n{list}(asd)
      `;

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render customHook components', () => {
      CustomHookComponents.validcomponent = class customComponent extends Component {
        render() {
          return <p>Custom</p>;
        }
      };

      props.markdown = `
        \n\n{customhook}(component:validcomponent,prop:'a prop',array:!((child:!(a),bool:!t),(child:!(b))))
        \n\nShould allow markdown between hooks
        \n\n{customhook}(component:validcomponent)
        \n\n{customhook}(component:invalidcomponent)
      `;

      render();
      expect(component).toMatchSnapshot();
    });

    it('should be able to render properly custom components not separated by \\n\\n', () => {
      props.markdown = '{youtube}(youtubeUrl)\n{media}(mediaUrl)';

      render();
      expect(component).toMatchSnapshot();
    });

    it('should not render html by default', () => {
      props.markdown = '<div><h1>should be all a escaped string</h1></div>';

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render Link', () => {
      props.markdown = '{link}(url:this_is_the_url,label:\'this is a label\')';

      render();
      expect(component).toMatchSnapshot();
    });

    describe('when passing html true prop', () => {
      it('should render html', () => {
        props.html = true;
        props.markdown = '<div><h1>test</h1></div>';

        render();
        expect(component).toMatchSnapshot();
      });

      it('should render customComponents nested inside html', () => {
        props.html = true;
        props.lists = [
          { params: 'param1', items: ['items1'], options: { option1: 'optionValue' } },
        ];
        props.markdown = '<div>{list}(url)(options) <div>{youtube}(url)</div></div>';

        render();
        expect(component).toMatchSnapshot();
      });
    });

    describe('when not valid html', () => {
      it('should not fail', () => {
        props.markdown = '<div><h</div>';
        props.html = true;

        render();
        expect(component).toMatchSnapshot();
      });
    });
  });
});
