import PropTypes from 'prop-types';
import React, { Component } from 'react';
import sanitizeHtml from 'sanitize-html';
import { risonDecodeOrIgnore } from 'app/utils';
import { Translate } from 'app/I18N';
import { MarkdownLink, SearchBox, MarkdownMedia, ItemList } from './components';
import CustomHookComponents from './CustomHooks';

import markdownToReact from './markdownToReact';
import { ValidatedElement } from './ValidatedElement';
import { visualizationHtmlTags } from './utils';

class MarkdownViewer extends Component {
  static errorHtml(index, message) {
    return (
      <p key={index} className="error">
        <br />
        <strong>
          <i>
            <Translate translationKey="Custom component error">
              Custom component markup error: unsupported values! Please check your configuration
            </Translate>
          </i>
        </strong>
        <br />
        {message}
        <br />
      </p>
    );
  }

  static customHook(config, index) {
    const props = risonDecodeOrIgnore(config);
    if (!CustomHookComponents[props.component]) {
      throw new Error('Invalid  component');
    }
    const Element = CustomHookComponents[props.component];
    return <Element {...props} key={index} />;
  }

  inlineComponent(type, config, index) {
    const { compact } = this.props;
    let result;
    if (type === 'list') {
      result = this.list(config, index);
    }

    if (type === 'link') {
      result = <MarkdownLink {...risonDecodeOrIgnore(config)} key={index} />;
    }

    if (type === 'searchbox') {
      result = <SearchBox {...risonDecodeOrIgnore(config)} key={index} />;
    }

    if (['vimeo', 'youtube', 'media'].includes(type)) {
      result = (
        <div key={index}>
          <MarkdownMedia key={index} config={config} compact={compact} />
        </div>
      );
    }

    if (type === 'customhook') {
      result = MarkdownViewer.customHook(config, index);
    }
    return result;
  }

  customComponent(type, config, index, children) {
    try {
      if (typeof type === 'function' || typeof type === 'object') {
        const Element = type;
        return (
          <Element {...config} key={index}>
            {children}
          </Element>
        );
      }

      if (type) {
        return this.inlineComponent(type, config, index);
      }
    } catch (error) {
      return MarkdownViewer.errorHtml(index, error.message);
    }

    return false;
  }

  list(_config, index) {
    const listData = this.props.lists[this.renderedLists] || {};
    const output = (
      <ItemList
        key={index}
        link={`/library/${listData.params}`}
        items={listData.items}
        options={listData.options}
      />
    );
    this.renderedLists += 1;
    return output;
  }

  render() {
    this.renderedLists = 0;

    if (typeof this.props.markdown !== 'string') {
      return false;
    }

    const sanitizedMarkdown = !this.props.sanitized
      ? this.props.markdown
      : sanitizeHtml(this.props.markdown, {
          allowedTags: visualizationHtmlTags,
          allowedAttributes: false,
        });

    const ReactFromMarkdown = markdownToReact(
      sanitizedMarkdown,
      this.customComponent.bind(this),
      this.props.html
    );

    if (!ReactFromMarkdown) {
      return false;
    }

    return ValidatedElement(
      'div',
      { className: 'markdown-viewer' },
      React.Children.toArray(ReactFromMarkdown),
      this.props.sanitized
    );
  }
}

MarkdownViewer.defaultProps = {
  lists: [],
  markdown: '',
  html: false,
  compact: false,
  sanitized: true,
};

MarkdownViewer.propTypes = {
  markdown: PropTypes.string,
  lists: PropTypes.arrayOf(PropTypes.object),
  html: PropTypes.bool,
  compact: PropTypes.bool,
  sanitized: PropTypes.bool,
};

export default MarkdownViewer;
