"use strict";
var _react = _interopRequireWildcard(require("react"));

var _enzyme = require("enzyme");

var _CustomHooks = _interopRequireDefault(require("../CustomHooks"));
var _MarkdownViewer = _interopRequireDefault(require("../MarkdownViewer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('MarkdownViewer', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      markdown: '## MarkdownContent' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MarkdownViewer.default, props));
  };

  const matchSnapshot = () => {
    render();
    expect(component).toMatchSnapshot();
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

      matchSnapshot();
    });

    it('should remove whitespaces between table tags (to prevent react warning)', () => {
      props.markdown = `
| cadh | cbdp | cidfp | cipst |
| - | - | - | - |
| 1.1,25.1 |  |  |  |
| 1.1,21.1,21.2,25,1 |  |  |  |
      `;

      matchSnapshot();
    });

    it('should support containers with custom classNames', () => {
      props.markdown = '::: test classname \ntext inside a div';

      matchSnapshot();
    });

    it('should render media components', () => {
      props.markdown = `{vimeo}(1234, options)
      \n\n{youtube}(1234)
      \n\n{media}(config options)
      `;

      matchSnapshot();
    });

    it('should render list components', () => {
      props.lists = [
      { params: 'param1', items: ['items1'], options: { option1: 'optionValue' } },
      { params: 'param2', items: ['items2'] },
      { params: 'param3', items: ['items3'] }];


      props.markdown = `{list}(first list)
        \n\n{list}(http://secondList)(limit:3)
        \n\n{list}(asd)
      `;

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render customHook components and show an error for invalid ones', () => {
      _CustomHooks.default.validcomponent = class customComponent extends _react.Component {
        render() {
          return _jsx("p", {}, void 0, "Custom");
        }};


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
      props.markdown = '{link}(url:this_is_the_url,label:\'this is a label\')' +
      '\n<MarkdownLink url="the_url">label</MarkDownLink>';
      props.html = true;

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
        { params: 'param1', items: ['items1'], options: { option1: 'optionValue' } }];

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

    it('should render a searchbox', () => {
      props.markdown = '{searchbox}(placeholder:\'this is a placeholder\')';

      render();
      expect(component).toMatchSnapshot();
    });

    it('should render properly a selfclosing XML tags', () => {
      props.html = true;
      props.markdown = '' +
      'test\n\n' +
      '<SearchBox/>\n' +
      '<div>test</div>';

      render();
      expect(component).toMatchSnapshot();
    });

    it('should remove Dataset and Query tags', () => {
      props.html = true;
      props.markdown = '' +
      'test\n\n' +
      '<Dataset />\n' +
      '<Query />\n' +
      '<SearchBox/>\n' +
      '<Dataset name="test" />\n' +
      '<div>test</div>';

      render();
      expect(component).toMatchSnapshot();
    });
  });
});