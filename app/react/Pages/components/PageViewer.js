import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import Immutable from 'immutable';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';
import { Context } from 'app/Markdown/components';
import { ErrorBoundary } from 'app/App/ErrorHandling/ErrorBoundary';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { parseRenderingError } from 'app/App/ErrorHandling/ErrorUtils';
import { reloadThesauri } from 'app/Thesauri/actions/thesaurisActions';

import { NeedAuthorization } from 'app/Auth';
import Script from './Script';

const parseSSRError = error => {
  const SSRError = error instanceof Immutable.Map ? error.toJS() : error;
  return SSRError?.json ? parseRenderingError(SSRError) : null;
};

class PageViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.warningPageError = this.warningPageError.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.page.get('title') !== this.props.page.get('title')) {
      this.removeCustomPageError();
    }
  }

  componentWillUnmount() {
    if (this.state.customPageError) {
      this.removeCustomPageError();
    }
  }

  warningPageError(error) {
    this.setState({ customPageError: error });
  }

  removeCustomPageError() {
    this.setState({ customPageError: null });
  }

  renderErrorWarning() {
    return (
      <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
        <div className="alert alert-danger">
          <Icon icon="exclamation-triangle" />
          <Translate translationKey="custom page error warning">
            There is an unexpected error on this custom page, it may not work properly. Please
            contact an admin for details.
          </Translate>
          <Icon icon="times" onClick={() => this.removeCustomPageError()} />
        </div>
      </NeedAuthorization>
    );
  }

  render() {
    const { page, itemLists, datasets, error, setBrowserTitle } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptRendered = page.getIn(['scriptRendered']);
    let scriptCode = page.getIn(['metadata', 'script']) || '';
    scriptCode = `var datasets = window.store.getState().page.datasets.toJS();
    ${scriptCode}`;
    const parsedPageError = parseSSRError(error);
    this.props.reloadThesauri();
    return (
      <div className="row">
        {!parsedPageError && (
          <>
            {setBrowserTitle && (
              <Helmet>
                <title>{page.get('title') ? page.get('title') : 'Page'}</title>
              </Helmet>
            )}
            <main className="page-viewer document-viewer">
              <div className="main-wrapper">
                {this.state.customPageError && this.renderErrorWarning()}
                <Context.Provider value={datasets}>
                  <ErrorBoundary>
                    <MarkdownViewer html markdown={originalText} lists={lists} />
                  </ErrorBoundary>
                </Context.Provider>
                <Footer />
              </div>
            </main>
            <Script scriptRendered={scriptRendered} onError={e => this.warningPageError(e)}>
              {scriptCode}
            </Script>
          </>
        )}
        {parsedPageError && (
          <div className="main-wrapper">
            <ErrorFallback error={parsedPageError} />
            <Footer />
          </div>
        )}
      </div>
    );
  }
}

PageViewer.defaultProps = {
  reloadThesauri: () => {},
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS([]),
  datasets: Immutable.fromJS({}),
  error: Immutable.fromJS({}),
  setBrowserTitle: true,
};

PageViewer.propTypes = {
  reloadThesauri: PropTypes.func.isRequired,
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List),
  datasets: PropTypes.instanceOf(Immutable.Map),
  error: PropTypes.instanceOf(Immutable.Map),
  setBrowserTitle: PropTypes.bool,
};

const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists,
  error: page.error,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      reloadThesauri,
    },
    dispatch
  );
}

const container = connect(mapStateToProps, mapDispatchToProps)(PageViewer);

export { container as PageViewer };
