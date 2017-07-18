import rison from 'rison';
import markdownEscapedValues from 'app/utils/markdownEscapedValues';

const listPlaceholder = '{---UWAZILIST---}';
const listEscape = '{list}';

const extractAdditionalOptions = (content, match) => {
  const optionsMatch = markdownEscapedValues(content, '(...)', `${listEscape}(${match})`)[0];

  let options = {};
  let matchString = '';

  if (optionsMatch) {
    matchString = `(${optionsMatch})`;
    try {
      options = rison.decode(`(${optionsMatch})`);
    } catch (err) {
      options = {};
    }
  }

  return {options, matchString};
};

export default {
  generate: (originalText) => {
    const values = markdownEscapedValues(originalText, '(...)', listEscape);
    const options = [];
    let content = originalText || '';

    const params = values.map(match => {
      const additionalOptions = extractAdditionalOptions(content, match);
      options.push(additionalOptions.options);
      content = content.replace(`${listEscape}(${match})${additionalOptions.matchString}`, listPlaceholder);
      const urlParams = /\?(.*)/g.exec(match);
      return urlParams ? urlParams[0] : '';
    });

    return {params, content, options};
  }
};
