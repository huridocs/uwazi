import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';
import MDComponents from 'app/Markdown/components';
import ErrorBoundary from 'app/App/ErrorHandling/ErrorBoundary';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { getRenderError } from 'app/App/ErrorHandling/ErrorUtils';
import Script from './Script';

const { Context } = MDComponents;

class PageViewer extends Component {
  render() {
    const { page, itemLists, datasets } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptRendered = page.getIn(['scriptRendered']);
    let scriptCode = page.getIn(['metadata', 'script']) || '';
    scriptCode = `var datasets = window.store.getState().page.datasets.toJS();
    ${scriptCode}`;
    const renderError = getRenderError(this.props.error?.toJS());
    if (!renderError.name) {
      return (
        <div className="row">
          <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
          <main className="page-viewer document-viewer">
            <div className="main-wrapper">
              <Context.Provider value={datasets}>
                <ErrorBoundary>
                  <MarkdownViewer html markdown={originalText} lists={lists} />
                </ErrorBoundary>
              </Context.Provider>
              <Footer />
            </div>
          </main>
          <Script scriptRendered={scriptRendered}>{scriptCode}</Script>
        </div>
      );
    }
    return <ErrorFallback error={renderError} />;
  }
}

PageViewer.defaultProps = {
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS([]),
  datasets: Immutable.fromJS({}),
  error: Immutable.fromJS({}),
};

PageViewer.propTypes = {
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List),
  datasets: PropTypes.instanceOf(Immutable.Map),
  error: PropTypes.instanceOf(Immutable.Map),
};

const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists,
  error: page.error,
});

const container = connect(mapStateToProps)(PageViewer);

export { container as PageViewer };
