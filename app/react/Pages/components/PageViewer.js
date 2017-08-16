import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import marked from 'marked';
import rison from 'rison';
import extendedMarked from 'app/utils/marked';
import markdownEscapedValues from 'app/utils/markdownEscapedValues';

import {ItemList} from './ItemList';
import CustomHookComponents from 'app/CustomHooks';

const listPlaceholder = '{---UWAZILIST---}';
const customHooksEscape = '{customhook}';
const customHooksPlaceholder = '{---UWAZICUSTOMHOOKS---}';

export class PageViewer extends Component {

  errorHtml(index) {
    return <p key={index} className="pageSection customHook error">
            <br />
              <strong><i>Custom Hook markup error: unsuported values! Please check your configuration</i></strong>
            <br />
           </p>;
  }

  prepareCustomHooks(originalText) {
    const customHookValues = markdownEscapedValues(originalText, '(...)', customHooksEscape);
    let content = originalText || '';

    customHookValues.forEach(value => {
      content = content.replace(`${customHooksEscape}(${value})`, customHooksPlaceholder);
    });

    return {customHookValues, content};
  }

  reduceSections(memo, token) {
    const listMatches = new RegExp(listPlaceholder, 'g').exec(token.text);
    const customHookMatches = new RegExp(customHooksPlaceholder, 'g').exec(token.text);

    if (token.type === 'paragraph' && listMatches) {
      memo.push('list');
    } else if (token.type === 'paragraph' && customHookMatches) {
      memo.push('customhook');
    } else if (!memo.length || memo[memo.length - 1] !== 'markdown') {
      memo.push('markdown');
    }

    return memo;
  }

  conformCustomHook(index, customHookValues) {
    let output = <p key={index}>Custom hook</p>;
    try {
      const props = rison.decode(`(${customHookValues.shift()})`);
      if (!CustomHookComponents[props.component]) {
        throw new Error('Invalid  component');
      }
      const Element = CustomHookComponents[props.component];
      output = <Element className="pageSection customHook" key={index} {...props} />;
    } catch (err) {
      output = this.errorHtml(index);
    }
    return output;
  }

  prepareHtml(sections, lists, customHookValues, htmlSplits) {
    return sections.map((type, index) => {
      if (type === 'list' && lists.length) {
        const listData = lists.shift();
        return <div key={index} className="pageSection markdownViewer">
                 <ItemList link={`/library/${listData.params}`} items={listData.items}/>
               </div>;
      }
      if (type === 'customhook' && customHookValues.length) {
        return this.conformCustomHook(index, customHookValues);
      }
      if (type === 'markdown' && htmlSplits.length) {
        const __html = htmlSplits.shift();
        return <div key={index}
                    className="pageSection markdownViewer"
                    dangerouslySetInnerHTML={{__html}}/>;
      }
      return false;
    });
  }

  render() {
    const {page, itemLists} = this.props;
    const lists = itemLists.toJS();
    let originalText = page.getIn(['metadata', 'content']) || '';

    const {customHookValues, content} = this.prepareCustomHooks(originalText);
    const tokens = marked.lexer(content, {sanitize: true});
    const sections = tokens.reduce(this.reduceSections, []);

    const html = extendedMarked(content);
    let htmlSplits = html.split(`<p>${listPlaceholder}</p>\n`).filter(i => i.length);
    htmlSplits = htmlSplits.reduce((memo, htmlSplit) => {
      return memo.concat(htmlSplit.split(`<p>${customHooksPlaceholder}</p>\n`).filter(i => i.length));
    }, []);

    return (
      <div className="row">
        <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
        <main className="document-viewer page-viewer">
          <div className="main-wrapper">
            <div className="document">
              {this.prepareHtml(sections, lists, customHookValues, htmlSplits)}
            </div>
          </div>
        </main>
      </div>
    );
  }
}

PageViewer.propTypes = {
  page: PropTypes.object,
  itemLists: PropTypes.object
};

const mapStateToProps = ({page}) => {
  return {
    page: page.pageView,
    itemLists: page.itemLists
  };
};

export default connect(mapStateToProps)(PageViewer);
