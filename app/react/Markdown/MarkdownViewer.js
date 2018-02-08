import PropTypes from 'prop-types';
import React, {Component} from 'react';
import marked from 'marked';
import rison from 'rison';
import CustomHookComponents from './CustomHooks';
import CustomComponents from './components';

const placeholder = '{-CUSTOMCOMPONENT-}';
const componentSubstitution = '{-spliter-}{-CUSTOMCOMPONENT-}{-spliter-}';
const spliter = '{-spliter-}';
const customComponentMatcher = /{\w+}\(.+\)\(.+\)|{\w+}\(.+\)/g;

export class MarkdownViewer extends Component {

  errorHtml(index) {
    return <p key={index} className="error">
            <br />
              <strong><i>Custom component markup error: unsuported values! Please check your configuration</i></strong>
            <br />
           </p>;
  }

  customHook(config, index) {
    let output;
    try {
      const props = rison.decode(config);
      if (!CustomHookComponents[props.component]) {
        throw new Error('Invalid  component');
      }
      const Element = CustomHookComponents[props.component];
      output = <Element {...props} key={index} />;
    } catch (err) {
      output = this.errorHtml(index);
    }
    return output;
  }

  list(config, index) {
    let listData = this.props.lists[this.renderedLists] || {};
    let output = <CustomComponents.ItemList key={index} link={`/library/${listData.params}`} items={listData.items} options={listData.options}/>;
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
      return this.customHook(config, index);
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
        let component = this.customComponent(customComponents[customComponentsPrinted], index);
        customComponentsPrinted += 1;
        return component;
      }
      let __html = marked(chunk);
      return <div key={index} dangerouslySetInnerHTML={{__html}}/>;
    });
  }

  render() {
    this.renderedLists = 0;
    return (
      <div className="markdown-viewer">
        {this.markdownToHtml(this.props.markdown).map((item) => item)}
      </div>
    );
  }
}

MarkdownViewer.defaultProps = {
  lists: []
};

MarkdownViewer.propTypes = {
  markdown: PropTypes.string,
  lists: PropTypes.array
};

export default MarkdownViewer;
