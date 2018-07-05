import React from 'react';

import HtmlToReact, { Parser } from 'html-to-react';
import instanceMarkdownIt from 'markdown-it';
import mdContainer from 'markdown-it-container';
import CustomComponents from './components';

const components = Object.keys(CustomComponents).reduce((map, key) => Object.assign({}, map, { [key.toLowerCase()]: CustomComponents[key] }), {});
const availableComponents = Object.keys(components);

const myParser = new Parser({ xmlMode: true });
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);
const customComponentMatcher = '{\\w+}\\(.+\\)\\(.+\\)|{\\w+}\\(.+\\)';

const dynamicCustomContainersConfig = {
  validate() { return true; },
  render(tokens, idx) {
    const token = tokens[idx];

    if (token.type === 'container_dynamic_open') {
      return `<div class="${token.info.trim()}">`;
    }
    return '</div>';
  }
};


const markdownIt = instanceMarkdownIt().use(mdContainer, 'dynamic', dynamicCustomContainersConfig);
const markdownItWithHtml = instanceMarkdownIt({ html: true }).use(mdContainer, 'dynamic', dynamicCustomContainersConfig);

const getConfig = (string) => {
  const customComponentOptionsMatcher = /{\w+}(\(.+\)\(.+\))|{\w+}(\(.+\))/g;
  let config;
  const configMatch = customComponentOptionsMatcher.exec(string);
  if (configMatch) {
    config = configMatch[1] || configMatch[2];
  }

  return config;
};

export default (_markdown, callback, withHtml = false) => {
  let renderer = markdownIt;
  if (withHtml) {
    renderer = markdownItWithHtml;
  }

  const markdown = _markdown.replace(new RegExp(`(${customComponentMatcher})`, 'g'), '$1\n');
  const html = renderer.render(markdown).replace(new RegExp(`<p>(${customComponentMatcher})</p>`, 'g'), '<placeholder>$1</placeholder>');

  const isValidNode = (node) => {
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
      if (node.name && node.name.toLowerCase() === 'dataset') {
        return false;
      }

      const customComponentTypeMatcher = /{(.+)}\(/;
      let type;
      let config;

      const isCustomComponentPlaceholder = node.name === 'placeholder'
        && node.children && node.children[0] && node.children[0].data && node.children[0].data.match(customComponentMatcher);

      if (isCustomComponentPlaceholder) {
        [, type] = node.children[0].data.match(customComponentTypeMatcher);
        config = getConfig(node.children[0].data);
      }

      const isCustomComponent = node && (!node.parent || node.parent && node.parent.name !== 'placeholder')
        && node.data && node.data.match(customComponentMatcher);

      if (isCustomComponent) {
        [, type] = node.data.match(customComponentTypeMatcher);
        config = getConfig(node.data);
      }

      if (availableComponents.includes(node.name ? node.name.toLowerCase() : '')) {
        type = components[node.name.toLowerCase()];
        config = node.attribs;
      }

      let newNode = callback(type, config, index, children);

      if (!newNode) {
        newNode = processNodeDefinitions.processDefaultNode(node, children, index);
      }

      return newNode;
    }
  }];


  return myParser.parseWithInstructions(html, isValidNode, processingInstructions);
};
