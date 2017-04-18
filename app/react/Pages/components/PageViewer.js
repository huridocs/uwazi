import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import marked from 'marked';
import extendedMarked from 'app/utils/marked';

import {ItemList} from './ItemList';

const listPlaceholder = '{---UWAZILIST---}';

export class PageViewer extends Component {
  render() {
    const {page, itemLists} = this.props;
    const content = page.getIn(['metadata', 'content']) || '';
    const lists = itemLists.toJS();

    const tokens = marked.lexer(content, {sanitize: true});

    const sections = tokens.reduce((memo, token) => {
      const listMatches = new RegExp(listPlaceholder, 'g').exec(token.text);
      if (token.type === 'paragraph' && listMatches) {
        memo.push('list');
      } else if (!memo.length || memo[memo.length - 1] !== 'markdown') {
        memo.push('markdown');
      }
      return memo;
    }, []);

    const html = extendedMarked(content);
    const htmlSplits = html.split(`<p>${listPlaceholder}</p>\n`).filter(i => i.length);

    const pageHtml = sections.map((type, index) => {
      if (type === 'list' && lists.length) {
        const listData = lists.shift();
        return <div key={index} className="markdownViewer">
                 <ItemList link={`/library/${listData.params}`} items={listData.items}/>
               </div>;
      }
      if (type === 'markdown' && htmlSplits.length) {
        return <div key={index}
                    className="markdownViewer"
                    dangerouslySetInnerHTML={{__html: htmlSplits.shift()}}/>;
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
