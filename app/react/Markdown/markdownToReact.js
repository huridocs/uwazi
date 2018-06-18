import React from 'react';

import HtmlToReact, { Parser } from 'html-to-react';
import instanceMarkdownIt from 'markdown-it';
import mdContainer from 'markdown-it-container';

const myParser = new Parser();
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);
const customComponentMatcher = '{\\w+}\\(.+\\)\\(.+\\)|{\\w+}\\(.+\\)';

const dynamicCustomContainersConfig = {
  validate() { return true; },
  render(tokens, idx) {
    const token = tokens[idx];

    if (token.nesting === 1) {
      return `<div class="${token.info.trim()}">`;
    }
    return '</div>';
  }
};


const markdownIt = instanceMarkdownIt().use(mdContainer, 'dynamic', dynamicCustomContainersConfig);
const markdownItWithHtml = instanceMarkdownIt({ html: true }).use(mdContainer, 'dynamic', dynamicCustomContainersConfig);

export default (_markdown, callback, withHtml = true) => {
  let renderer = markdownIt;
    renderer = markdownItWithHtml;

  const markdown = _markdown.replace(new RegExp(`(${customComponentMatcher})`, 'g'), '$1\n');
  // const html = renderer.render(markdown).replace(/<p>({\w+}\(.+\)\(.+\)|{\w+}\(.+\))<\/p>/g, '<placeholder>$1</placeholder>');
  const html = renderer.render(markdown).replace(new RegExp(`<p>(${customComponentMatcher})</p>`, 'g'), '<placeholder>$1</placeholder>');

  const isValidNode = () => true;
  const processingInstructions = [{
    shouldProcessNode() {
      return true;
    },
    processNode: (node, children, index) => {
      const customComponentTypeMatcher = /{(.+)}\(/;
      const customComponentOptionsMatcher = /{\w+}(\(.+\)\(.+\))|{\w+}(\(.+\))/g;
      let type;
      let config;
      if (node.name === 'placeholder' && node.children && node.children[0] && node.children[0].data && node.children[0].data.match(customComponentMatcher)) {
        type = node.children[0].data.match(customComponentTypeMatcher)[1];
        const configMatch = customComponentOptionsMatcher.exec(node.children[0].data);
        if (configMatch) {
          config = configMatch[1] || configMatch[2];
        }
      }

      if (node && node.data && node.data.match(customComponentMatcher)) {
        type = node.data.match(customComponentTypeMatcher)[1];
        const configMatch = customComponentOptionsMatcher.exec(node.data);
        if (configMatch) {
          config = configMatch[1] || configMatch[2];
        }
      }

      if (type) {
        return callback(type, config, index);
      }

      return processNodeDefinitions.processDefaultNode(node, children, index);
    }
  }];

  return myParser.parseWithInstructions(html, isValidNode, processingInstructions);
};
