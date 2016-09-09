import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import marked from 'marked';

export class PageViewer extends Component {
  render() {
    let {page} = this.props;
    return (
      <main className="document-viewer">
        <div className="main-wrapper">
          <h1>{page.get('title')}</h1>
          <div className="markdownViewer"
               dangerouslySetInnerHTML={{__html: marked(page.getIn(['metadata', 'content']) || '', {sanitize: true})}}/>
        </div>
      </main>
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
