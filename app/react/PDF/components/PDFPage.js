import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { isClient } from 'app/utils';
import { PageReferences } from 'app/Viewer/components/PageReferences';
import { PageSelections } from 'app/Viewer/components/PageSelections';
import PDFJS, { EventBus } from '../PDFJS';

class PDFPage extends Component {
  constructor(props) {
    super(props);
    this.state = { rendered: false };
  }

  componentDidMount() {
    this.scrollCallback = this.scroll.bind(this);

    if (this.pageContainer && this.pageShouldRender()) {
      this.renderPage();
    }

    this.props.getViewportContainer().addEventListener('scroll', this.scrollCallback);
    this._mounted = true;
  }

  componentWillUnmount() {
    if (this.pdfPageView) {
      this.pdfPageView.destroy();
    }
    this.props.getViewportContainer().removeEventListener('scroll', this.scrollCallback);
    this._mounted = false;
  }

  scroll() {
    if (this.pageShouldRender() && !this.state.rendered) {
      this.renderPage();
    }

    if (!this.pageShouldRender() && this.pdfPageView) {
      this.pdfPageView.cancelRendering();
      this.pdfPageView.destroy();
      if (this.state.rendered) {
        this.props.onUnload(this.props.page);
      }
      this.setState({ rendered: false });
    }
  }

  pageShouldRender() {
    const pageRectangle = this.pageContainer.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    if (
      pageRectangle.right < 0 ||
      pageRectangle.bottom < -500 ||
      pageRectangle.left > vWidth ||
      pageRectangle.top > vHeight + 500
    ) {
      this.props.onHidden(this.props.page);
      return false;
    }
    this.checkVisibility(pageRectangle);
    return true;
  }

  checkVisibility(pageRectangle) {
    const viewportRect = this.props.getViewportContainer().getBoundingClientRect();

    const relativeElementRect = {
      top: pageRectangle.top - viewportRect.top,
      bottom: pageRectangle.bottom,
    };

    const offsetTop = relativeElementRect.top < 0 ? -relativeElementRect.top : 0;
    const offsetBottom =
      pageRectangle.bottom - viewportRect.bottom > 0
        ? pageRectangle.bottom - viewportRect.bottom
        : 0;
    const visibility = pageRectangle.height - offsetTop - offsetBottom;

    if (visibility > 0) {
      this.props.onVisible(this.props.page, visibility);
    }

    if (visibility < 0) {
      this.props.onHidden(this.props.page);
    }
  }

  renderReferences() {
    if (this.state.rendered) {
      return (
        <>
          <PageSelections />
          <PageReferences page={this.props.page} onClick={this.props.highlightReference} />
        </>
      );
    }

    return false;
  }

  renderPage() {
    if (!this.state.rendered && this.pdfPageView) {
      this.props.onLoading(this.props.page);
      this.pdfPageView.draw().catch(e => e);
      this.setState({ rendered: true });

      return;
    }
    if (!this.state.rendered) {
      this.props.onLoading(this.props.page);
      this.setState({ rendered: true });
      this.props.pdf.getPage(this.props.page).then(page => {
        const scale = 1;

        this.pdfPageView = new PDFJS.PDFPageView({
          container: this.pageContainer,
          id: this.props.page,
          scale,
          defaultViewport: page.getViewport({ scale }),
          textLayerMode: 1,
          eventBus: new EventBus(),
        });

        this.pdfPageView.setPdfPage(page);
        this.pdfPageView
          .draw()
          .then(() => {
            if (this._mounted) {
              this.setState({ height: this.pdfPageView.viewport.height });
            }
          })
          .catch(e => e);
      });
    }
  }

  render() {
    const style = { height: 1100 };
    if (this.state && this.state.height) {
      style.height = this.state.height + 20;
    }
    return (
      <div
        id={`page-${this.props.page}`}
        className="doc-page"
        ref={ref => {
          this.pageContainer = ref;
        }}
        style={style}
      >
        {this.renderReferences()}
      </div>
    );
  }
}

PDFPage.defaultProps = {
  getViewportContainer: () => (isClient ? document.querySelector('.document-viewer') : null),
  onVisible: () => {},
  onHidden: () => {},
  highlightReference: () => {},
};

PDFPage.propTypes = {
  getViewportContainer: PropTypes.func,
  page: PropTypes.number.isRequired,
  onVisible: PropTypes.func,
  onHidden: PropTypes.func,
  onLoading: PropTypes.func.isRequired,
  onUnload: PropTypes.func.isRequired,
  pdf: PropTypes.object.isRequired,
  highlightReference: PropTypes.func,
};

export default PDFPage;
