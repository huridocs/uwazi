import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';

export class PageViewer extends Component {
  render() {
    const { page, itemLists } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';

    return (
      <div className="row">
        <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
        <main className="page-viewer document-viewer">
          <div className="main-wrapper">
            <MarkdownViewer markdown={originalText} lists={lists}/>
            <Footer/>
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

const mapStateToProps = ({ page }) => ({
    page: page.pageView,
    itemLists: page.itemLists
});

export default connect(mapStateToProps)(PageViewer);
