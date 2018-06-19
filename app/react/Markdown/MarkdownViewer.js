import PropTypes from 'prop-types';
import React, { Component } from 'react';
import rison from 'rison';

import CustomComponents from './components';
import CustomHookComponents from './CustomHooks';

import markdownToReact from './markdownToReact';

class MarkdownViewer extends Component {
  static errorHtml(index, message) {
    return (
      <p key={index} className="error">
        <br />
        <strong><i>Custom component markup error: unsuported values! Please check your configuration</i></strong>
        <br />
        {message}
        <br />
      </p>
    );
  }

  static customHook(config, index) {
    const props = rison.decode(config);
    if (!CustomHookComponents[props.component]) {
      throw new Error('Invalid  component');
    }
    const Element = CustomHookComponents[props.component];
    return <Element {...props} key={index} />;
  }

  static customComponent(type, config, index) {
    try {
      if (type === 'list') {
        return this.list(config, index);
      }

      if (type === 'link') {
        return <CustomComponents.MarkdownLink {...rison.decode(config)} key={index}/>;
      }

      if (['vimeo', 'youtube', 'media'].includes(type)) {
        return <CustomComponents.MarkdownMedia key={index} config={config} />;
      }

      if (type === 'customhook') {
        return MarkdownViewer.customHook(config, index);
      }
    } catch (error) {
      return MarkdownViewer.errorHtml(index, error.message);
    }

    return false;
  }

  list(config, index) {
    const listData = this.props.lists[this.renderedLists] || {};
    const output = <CustomComponents.ItemList key={index} link={`/library/${listData.params}`} items={listData.items} options={listData.options}/>;
    this.renderedLists += 1;
    return output;
  }

  render() {
    this.renderedLists = 0;

    const ReactFromMarkdown = markdownToReact(this.props.markdown, MarkdownViewer.customComponent.bind(this), this.props.html);

    if (!ReactFromMarkdown) {
      return false;
    }

    return <div className="markdown-viewer">{ReactFromMarkdown}</div>;
  }
}

MarkdownViewer.defaultProps = {
  lists: [],
  markdown: '',
  html: false
};

MarkdownViewer.propTypes = {
  markdown: PropTypes.string,
  lists: PropTypes.arrayOf(PropTypes.object),
  html: PropTypes.bool
};

export default MarkdownViewer;
