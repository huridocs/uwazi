"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));

var _htmlToReact = _interopRequireWildcard(require("html-to-react"));
var _markdownIt = _interopRequireDefault(require("markdown-it"));
var _markdownItContainer = _interopRequireDefault(require("markdown-it-container"));
var _components = _interopRequireDefault(require("./components"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const components = Object.keys(_components.default).reduce((map, key) => Object.assign({}, map, { [key.toLowerCase()]: _components.default[key] }), {});
const availableComponents = Object.keys(components);

const myParser = new _htmlToReact.Parser({ xmlMode: true });
const processNodeDefinitions = new _htmlToReact.default.ProcessNodeDefinitions(_react.default);
const customComponentMatcher = '{\\w+}\\(.+\\)\\(.+\\)|{\\w+}\\(.+\\)';

const dynamicCustomContainersConfig = {
  validate() {return true;},
  render(tokens, idx) {
    const token = tokens[idx];

    if (token.type === 'container_dynamic_open') {
      return `<div class="${token.info.trim()}">`;
    }
    return '</div>';
  } };



const markdownIt = (0, _markdownIt.default)().use(_markdownItContainer.default, 'dynamic', dynamicCustomContainersConfig);
const markdownItWithHtml = (0, _markdownIt.default)({ html: true }).use(_markdownItContainer.default, 'dynamic', dynamicCustomContainersConfig);
const customComponentTypeMatcher = /{(.+)}\(/;

const getConfig = string => {
  const customComponentOptionsMatcher = /{\w+}(\(.+\)\(.+\))|{\w+}(\(.+\))/g;
  let config;
  const configMatch = customComponentOptionsMatcher.exec(string);
  if (configMatch) {
    config = configMatch[1] || configMatch[2];
  }

  return config;
};

const removeWhitespacesInsideTableTags = html => html.
replace(/((\/)?(table|thead|tbody|tr|th|td)>)[\s\n]+(<(\/)?(table|thead|tbody|tr|th|td))/g, '$1$4').
replace(/((\/)?(table|thead|tbody|tr|th|td)>)[\s\n]+(<(\/)?(table|thead|tbody|tr|th|td))/g, '$1$4');

const getNodeTypeAndConfig = (_config, node, isCustomComponentPlaceholder, isCustomComponent) => {
  let type;
  let config = _config;

  if (isCustomComponentPlaceholder) {
    [, type] = node.children[0].data.match(customComponentTypeMatcher);
    config = getConfig(node.children[0].data);
  }

  if (isCustomComponent) {
    [, type] = node.data.match(customComponentTypeMatcher);
    config = getConfig(node.data);
  }

  type = availableComponents.includes(node.name ? node.name.toLowerCase() : '') ? components[node.name.toLowerCase()] : type;

  return { type, config };
};var _default =

(_markdown, callback, withHtml = false) => {
  let renderer = markdownIt;
  if (withHtml) {
    renderer = markdownItWithHtml;
  }

  const markdown = _markdown.replace(new RegExp(`(${customComponentMatcher})`, 'g'), '$1\n');

  const html = removeWhitespacesInsideTableTags(
  renderer.render(markdown).replace(new RegExp(`<p>(${customComponentMatcher})</p>`, 'g'), '<placeholder>$1</placeholder>'));


  const isValidNode = node => {
    const isBadNode = node.type === 'tag' && node.name.match(/<|>/g);
    if (isBadNode) {
      return false;
    }
    return true;
  };

  const processingInstructions = [{
    shouldProcessNode() {
      return true;
    },

    processNode: (node, children, index) => {
      if (node.name && (node.name.toLowerCase() === 'dataset' || node.name.toLowerCase() === 'query')) {
        return false;
      }
      const isCustomComponentPlaceholder = node.name === 'placeholder' &&
      node.children && node.children[0] && node.children[0].data && node.children[0].data.match(customComponentMatcher);

      const isCustomComponent = node && (!node.parent || node.parent && node.parent.name !== 'placeholder') &&
      node.data && node.data.match(customComponentMatcher);

      const { type, config } = getNodeTypeAndConfig(node.attribs, node, isCustomComponentPlaceholder, isCustomComponent);

      const newNode = callback(type, config, index, children);

      return newNode || processNodeDefinitions.processDefaultNode(node, children, index);
    } }];


  return myParser.parseWithInstructions(html, isValidNode, processingInstructions);
};exports.default = _default;