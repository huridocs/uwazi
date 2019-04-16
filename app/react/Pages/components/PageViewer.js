import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';

import Script from './Script';

export class PageViewer extends Component {
  render() {
    const { page, itemLists } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptCode = page.getIn(['metadata', 'script']) || '';

    return (
      <div className="row">
        <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
        <main className="page-viewer document-viewer">
          <div className="main-wrapper">
            <MarkdownViewer html markdown={originalText} lists={lists}/>
            <Footer/>
          </div>
        </main>
        <Script>{scriptCode}</Script>
      </div>
    );
  }
}

PageViewer.defaultProps = {
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS({})
};

PageViewer.propTypes = {
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List)
};

const mapStateToProps = ({ page }) => ({
    page: page.pageView,
    itemLists: page.itemLists
});

export default connect(mapStateToProps)(PageViewer);
