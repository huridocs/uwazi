import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';
import MDComponents from 'app/Markdown/components';

import Script from './Script';

const { Context } = MDComponents;

export class PageViewer extends Component {
  render() {
    const { page, itemLists, datasets } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptCode = page.getIn(['metadata', 'script']) || '';

    return (
      <div className="row">
        <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
        <main className="page-viewer document-viewer">
          <div className="main-wrapper">
            <Context.Provider value={datasets}>
              <MarkdownViewer html markdown={originalText} lists={lists} />
            </Context.Provider>
            <Footer />
          </div>
        </main>
        <Script>{scriptCode}</Script>
      </div>
    );
  }
}

PageViewer.defaultProps = {
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS([]),
  datasets: Immutable.fromJS({}),
};

PageViewer.propTypes = {
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List),
  datasets: PropTypes.instanceOf(Immutable.Map),
};

const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists,
});

export default connect(mapStateToProps)(PageViewer);
