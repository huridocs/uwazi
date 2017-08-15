import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import marked from 'marked';
import rison from 'rison';
import extendedMarked from 'app/utils/marked';
import markdownEscapedValues from 'app/utils/markdownEscapedValues';

import {ItemList} from './ItemList';
import * as CustomHookComponents from 'app/CustomHooks';

const listPlaceholder = '{---UWAZILIST---}';
const customHooksEscape = '{customhook}';
const customHooksPlaceholder = '{---UWAZICUSTOMHOOKS---}';

export class PageViewer extends Component {
  render() {
    const {page, itemLists} = this.props;
    const lists = itemLists.toJS();
    let originalText = page.getIn(['metadata', 'content']) || '';

    // TEST!!!
    const customHookValues = markdownEscapedValues(originalText, '(...)', customHooksEscape);
    let content = originalText || '';

    customHookValues.forEach(value => {
      content = content.replace(`${customHooksEscape}(${value})`, customHooksPlaceholder);
    });
    // -----------
    const tokens = marked.lexer(content, {sanitize: true});

    const sections = tokens.reduce((memo, token) => {
      const listMatches = new RegExp(listPlaceholder, 'g').exec(token.text);
      // TEST!!!
      const customHookMatches = new RegExp(customHooksPlaceholder, 'g').exec(token.text);
      // --------
      if (token.type === 'paragraph' && listMatches) {
        memo.push('list');
      // TEST!!!
      } else if (token.type === 'paragraph' && customHookMatches) {
        memo.push('customhook');
      // --------
      } else if (!memo.length || memo[memo.length - 1] !== 'markdown') {
        memo.push('markdown');
      }
      return memo;
    }, []);

    const html = extendedMarked(content);
    let htmlSplits = html.split(`<p>${listPlaceholder}</p>\n`).filter(i => i.length);
    htmlSplits = htmlSplits.reduce((memo, htmlSplit) => {
      return memo.concat(htmlSplit.split(`<p>${customHooksPlaceholder}</p>\n`).filter(i => i.length));
    }, []);

    const pageHtml = sections.map((type, index) => {
      if (type === 'list' && lists.length) {
        const listData = lists.shift();
        return <div key={index} className="markdownViewer">
                 <ItemList link={`/library/${listData.params}`} items={listData.items}/>
               </div>;
      }
      // TEST!!!!
      if (type === 'customhook' && customHookValues.length) {
        let output = <p key={index}>Custom hook</p>;
        try {
          const options = rison.decode(`(${customHookValues.shift()})`);
          if (!CustomHookComponents[options.component]) {
            throw new Error('Invalid  component');
          }
          const Element = CustomHookComponents[options.component];
          output = <Element key={index} />;
        } catch (err) {
          output = <p key={index}>
                     <br />
                       <strong><i>Custom Hook markup error: unsuported values, please check your configuration</i></strong>
                     <br />
                   </p>;
        }
        return output;
      }
      // -------
      if (type === 'markdown' && htmlSplits.length) {
        const __html = htmlSplits.shift();
        return <div key={index}
                    className="markdownViewer"
                    dangerouslySetInnerHTML={{__html}}/>;
      }
      return false;
    });

    return (
      <div className="row">
        <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
        <main className="document-viewer page-viewer">
          <div className="main-wrapper">
            <div className="document">
              {pageHtml}
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
