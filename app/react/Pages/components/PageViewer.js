import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import marked from 'marked';

import {Link} from 'react-router';

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

    const html = marked(content, {sanitize: true});
    const htmlSplits = html.split(`<p>${listPlaceholder}</p>\n`).filter(i => i.length);

    const pageHtml = sections.map((type, index) => {
      if (type === 'list' && lists.length) {
        return <div key={index} className="markdownViewer">
                   <Link to={`/${lists.shift().params}`}>Esto si funciona</Link>
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
        <main className="document-viewer page-viewer">
          <div className="main-wrapper">
            <div className="document">
              <div className="page">
                {pageHtml}
              </div>
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
