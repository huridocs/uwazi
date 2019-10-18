"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _rison = _interopRequireDefault(require("rison"));

var _components = _interopRequireDefault(require("./components"));
var _CustomHooks = _interopRequireDefault(require("./CustomHooks"));

var _markdownToReact = _interopRequireDefault(require("./markdownToReact"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class MarkdownViewer extends _react.Component {
  static errorHtml(index, message) {
    return (
      _jsx("p", { className: "error" }, index,
      _jsx("br", {}),
      _jsx("strong", {}, void 0, _jsx("i", {}, void 0, "Custom component markup error: unsuported values! Please check your configuration")),
      _jsx("br", {}),
      message,
      _jsx("br", {})));


  }

  static customHook(config, index) {
    const props = _rison.default.decode(config);
    if (!_CustomHooks.default[props.component]) {
      throw new Error('Invalid  component');
    }
    const Element = _CustomHooks.default[props.component];
    return _react.default.createElement(Element, _extends({}, props, { key: index }));
  }

  inlineComponent(type, config, index) {
    const { compact } = this.props;
    let result;
    if (type === 'list') {
      result = this.list(config, index);
    }

    if (type === 'link') {
      result = _react.default.createElement(_components.default.MarkdownLink, _extends({}, _rison.default.decode(config), { key: index }));
    }

    if (type === 'searchbox') {
      result = _react.default.createElement(_components.default.SearchBox, _extends({}, _rison.default.decode(config), { key: index }));
    }

    if (['vimeo', 'youtube', 'media'].includes(type)) {
      result = _jsx(_components.default.MarkdownMedia, { config: config, compact: compact }, index);
    }

    if (type === 'customhook') {
      result = MarkdownViewer.customHook(config, index);
    }
    return result;
  }

  customComponent(type, config, index, children) {
    try {
      if (typeof type === 'function') {
        const Element = type;
        return _react.default.createElement(Element, _extends({}, config, { key: index }), children);
      }

      if (type) {
        return this.inlineComponent(type, config, index);
      }
    } catch (error) {
      return MarkdownViewer.errorHtml(index, error.message);
    }

    return false;
  }

  list(config, index) {
    const listData = this.props.lists[this.renderedLists] || {};
    const output = _jsx(_components.default.ItemList, { link: `/library/${listData.params}`, items: listData.items, options: listData.options }, index);
    this.renderedLists += 1;
    return output;
  }

  render() {
    this.renderedLists = 0;

    const ReactFromMarkdown = (0, _markdownToReact.default)(this.props.markdown, this.customComponent.bind(this), this.props.html);

    if (!ReactFromMarkdown) {
      return false;
    }

    return _jsx("div", { className: "markdown-viewer" }, void 0, ReactFromMarkdown);
  }}


MarkdownViewer.defaultProps = {
  lists: [],
  markdown: '',
  html: false,
  compact: false };var _default =









MarkdownViewer;exports.default = _default;