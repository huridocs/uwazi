import markdownEscapedValues from 'app/utils/markdownEscapedValues';

const listPlaceholder = '{---UWAZILIST---}';
const listEscape = '{list}';

export default {
  generate: (originalText) => {
    const values = markdownEscapedValues(originalText, '(...)', listEscape);

    let content = originalText || '';
    const params = values.map(match => {
      content = content.replace(`${listEscape}(${match})`, listPlaceholder);
      const urlParams = /\?(.*)/g.exec(match);
      return urlParams ? urlParams[0] : '';
    });

    return {params, content};
  }
};
