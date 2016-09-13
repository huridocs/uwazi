import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import marked from 'marked';

export class PageViewer extends Component {
  render() {
    let {page} = this.props;
    return (
      <div className="row">
        <main className="document-viewer page-viewer">
          <div className="main-wrapper">
            <div className="document">
              <div className="page">
              <h1>{page.get('title')}</h1>
                <div className="markdownViewer"
                  dangerouslySetInnerHTML={{__html: marked(page.getIn(['metadata', 'content']) || '', {sanitize: true})}}/>
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
