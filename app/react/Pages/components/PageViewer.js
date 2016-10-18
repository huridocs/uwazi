import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import marked from 'marked';

import {Link} from 'react-router';

const listPlaceholder = '{---UWAZILIST---}';

export class PageViewer extends Component {
  render() {
    // List escape code: {list}(http://someurl.com/es/?parameters=values)
    const listMatch = /{list}\((.*?)\)/g;

    const {page} = this.props;

    let lists = [];

    const content = page.getIn(['metadata', 'content']) || '';
    const newContent = content.replace(listMatch, (_, group) => {
      lists.push(group);
      return listPlaceholder;
    });

    const tokens = marked.lexer(newContent, {sanitize: true});

    const sectionsData = tokens.reduce((memo, token) => {
      const listMatches = new RegExp(listPlaceholder, 'g').exec(token.text);
      if (token.type === 'paragraph' && listMatches) {
        memo.sections.push('list');
        memo.previousType = 'list';
      } else {
        if (!memo.previousType || memo.previousType !== 'markdown') {
          memo.sections.push('markdown');
        }
        memo.previousType = 'markdown';
      }
      return memo;
    }, {sections: []});

    const html = marked(newContent, {sanitize: true});

    const htmlSplits = html.split('<p>{---UWAZILIST---}</p>\n').filter(i => i.length);

    const pageHtml = sectionsData.sections.map((type, index) => {
      if (type === 'list') {
        return <Link key={index} to={lists.shift()}>Esto si funciona</Link>;
      }
      if (type === 'markdown') {
        return <div key={index}
                    className="markdownViewer"
                    dangerouslySetInnerHTML={{__html: htmlSplits.shift()}}/>;
      }
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
  page: PropTypes.object
};

const mapStateToProps = (state) => {
  return {page: state.page.pageView};
};

export default connect(mapStateToProps)(PageViewer);
