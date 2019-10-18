"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _rison = _interopRequireDefault(require("rison"));
var _markdownEscapedValues = _interopRequireDefault(require("../../utils/markdownEscapedValues"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const listPlaceholder = '{---UWAZILIST---}';
const listEscape = '{list}';

const extractAdditionalOptions = (content, match) => {
  const optionsMatch = (0, _markdownEscapedValues.default)(content, '(...)', `${listEscape}(${match})`)[0];

  let options = {};
  let matchString = '';

  if (optionsMatch) {
    matchString = `(${optionsMatch})`;
    try {
      options = _rison.default.decode(`(${optionsMatch})`);
    } catch (err) {
      options = {};
    }
  }

  return { options, matchString };
};var _default =

{
  generate: originalText => {
    const values = (0, _markdownEscapedValues.default)(originalText, '(...)', listEscape);
    const options = [];
    let content = originalText || '';

    const params = values.map(match => {
      const additionalOptions = extractAdditionalOptions(content, match);
      options.push(additionalOptions.options);
      content = content.replace(`${listEscape}(${match})${additionalOptions.matchString}`, listPlaceholder);
      const urlParams = /\?(.*)/g.exec(match);
      return urlParams ? urlParams[0] : '';
    });

    return { params, content, options };
  } };exports.default = _default;