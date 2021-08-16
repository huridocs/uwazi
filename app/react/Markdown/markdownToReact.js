import React from 'react';

import HtmlToReact, { Parser } from 'html-to-react';
import instanceMarkdownIt from 'markdown-it';
import mdContainer from 'markdown-it-container';
import * as CustomComponents from './components';

const components = Object.keys(CustomComponents).reduce(
  (map, key) => ({ ...map, [key.toLowerCase()]: CustomComponents[key] }),
  {}
);
const availableComponents = Object.keys(components);

const myParser = new Parser({ xmlMode: true });
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);
const customComponentMatcher = '{\\w+}\\(.+\\)\\(.+\\)|{\\w+}\\(.+\\)';

const dynamicCustomContainersConfig = {
  validate() {
    return true;
  },
  render(tokens, idx) {
    const token = tokens[idx];

    if (token.type === 'container_dynamic_open') {
      return `<div class="${token.info.trim()}">`;
    }
    return '</div>';
  },
};

const markdownIt = instanceMarkdownIt({ xhtmlOut: true }).use(
  mdContainer,
  'dynamic',
  dynamicCustomContainersConfig
);
const markdownItWithHtml = instanceMarkdownIt({ html: true, xhtmlOut: true }).use(
  mdContainer,
  'dynamic',
  dynamicCustomContainersConfig
);
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

const removeWhitespacesInsideTableTags = html =>
  html
    .replace(
      /((\/)?(table|thead|tbody|tr|th|td)>)[\s\n]+(<(\/)?(table|thead|tbody|tr|th|td))/g,
      '$1$4'
    )
    .replace(
      /((\/)?(table|thead|tbody|tr|th|td)>)[\s\n]+(<(\/)?(table|thead|tbody|tr|th|td))/g,
      '$1$4'
    );

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

  type = availableComponents.includes(node.name ? node.name.toLowerCase() : '')
    ? components[node.name.toLowerCase()]
    : type;

  return { type, config };
};

export default (_markdown, callback, withHtml = false) => {
  let renderer = markdownIt;
  if (withHtml) {
    renderer = markdownItWithHtml;
  }

  const markdown = _markdown.replace(new RegExp(`(${customComponentMatcher})`, 'g'), '$1\n');

  const html = removeWhitespacesInsideTableTags(
    renderer
      .render(markdown)
      .replace(
        new RegExp(`<p>(${customComponentMatcher})</p>`, 'g'),
        '<placeholder>$1</placeholder>'
      )
  );

  const isValidNode = node => {
    const isBadNode = node.type === 'tag' && node.name.match(/<|>/g);
    if (isBadNode) {
      return false;
    }
    return true;
  };

  const processingInstructions = [
    {
      shouldProcessNode() {
        return true;
      },

      processNode: (node, children, index) => {
        if (
          node.name &&
          (node.name.toLowerCase() === 'dataset' || node.name.toLowerCase() === 'query')
        ) {
          return false;
        }
        const isCustomComponentPlaceholder =
          node.name === 'placeholder' &&
          node.children &&
          node.children[0] &&
          node.children[0].data &&
          node.children[0].data.match(customComponentMatcher);

        const isCustomComponent =
          node &&
          (!node.parent || (node.parent && node.parent.name !== 'placeholder')) &&
          node.data &&
          node.data.match(customComponentMatcher);

        const { type, config } = getNodeTypeAndConfig(
          node.attribs,
          node,
          isCustomComponentPlaceholder,
          isCustomComponent
        );

        const newNode = callback(type, config, index, children);

        return newNode || processNodeDefinitions.processDefaultNode(node, children, index);
      },
    },
  ];

  return myParser.parseWithInstructions(html, isValidNode, processingInstructions);
};
