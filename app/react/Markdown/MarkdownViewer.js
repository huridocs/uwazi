import PropTypes from 'prop-types';
import React, { Component } from 'react';
import markdownIt from 'markdown-it';
import rison from 'rison';
import CustomHookComponents from './CustomHooks';
import CustomComponents from './components';

const placeholder = '{-CUSTOMCOMPONENT-}';
const componentSubstitution = '{-spliter-}{-CUSTOMCOMPONENT-}{-spliter-}';
const spliter = '{-spliter-}';
const customComponentMatcher = /{\w+}\(.+\)\(.+\)|{\w+}\(.+\)/g;
const md = markdownIt();

export class MarkdownViewer extends Component {
  static errorHtml(index) {
    return (
      <p key={index} className="error">
        <br />
        <strong><i>Custom component markup error: unsuported values! Please check your configuration</i></strong>
        <br />
      </p>
    );
  }

  static customHook(config, index) {
    let output;
    try {
      const props = rison.decode(config);
      if (!CustomHookComponents[props.component]) {
        throw new Error('Invalid  component');
      }
      const Element = CustomHookComponents[props.component];
      output = <Element {...props} key={index} />;
    } catch (err) {
      output = MarkdownViewer.errorHtml(index);
    }
    return output;
  }

  list(config, index) {
    const listData = this.props.lists[this.renderedLists] || {};
    const output = <CustomComponents.ItemList key={index} link={`/library/${listData.params}`} items={listData.items} options={listData.options}/>;
    this.renderedLists += 1;
    return output;
  }

  customComponent(customComponentString, index) {
    const customComponentTypeMatcher = /{(.+)}\(/;
    const customComponentOptionsMatcher = /{\w+}(\(.+\)\(.+\))|{\w+}(\(.+\))/g;
    const type = customComponentString.match(customComponentTypeMatcher)[1];
    const configMatch = customComponentOptionsMatcher.exec(customComponentString);
    let config;
    if (configMatch) {
      config = configMatch[1] || configMatch[2];
    }

    if (type === 'customhook') {
      return MarkdownViewer.customHook(config, index);
    }

    if (type === 'vimeo') {
      return <CustomComponents.MarkdownVimeo key={index} config={config} />;
    }

    if (type === 'youtube') {
      return <CustomComponents.MarkdownYoutube key={index} config={config} />;
    }

    if (type === 'list') {
      return this.list(config, index);
    }

    return <div key={index}>{customComponentString}</div>;
  }

  markdownToHtml(markdown) {
    const customComponents = markdown.match(customComponentMatcher);
    const htmlChunks = markdown.replace(customComponentMatcher, componentSubstitution).split(spliter);
    let customComponentsPrinted = 0;
    return htmlChunks.map((chunk, index) => {
      if (chunk === placeholder) {
        const component = this.customComponent(customComponents[customComponentsPrinted], index);
        customComponentsPrinted += 1;
        return component;
      }
      const __html = md.render(chunk);
      return <div key={index} dangerouslySetInnerHTML={{ __html }}/>; // eslint-disable-line
    });
  }

  render() {
    this.renderedLists = 0;
    return (
      <div className="markdown-viewer">
        {this.markdownToHtml(this.props.markdown).map(item => item)}
      </div>
    );
  }
}

MarkdownViewer.defaultProps = {
  lists: [],
  markdown: ''
};

MarkdownViewer.propTypes = {
  markdown: PropTypes.string,
  lists: PropTypes.arrayOf(PropTypes.object)
};

export default MarkdownViewer;
