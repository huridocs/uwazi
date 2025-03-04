import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { scrollToToc } from 'app/Viewer/actions/uiActions';
import ShowIf from 'app/App/ShowIf';
import { t } from 'app/I18N';
import { Icon } from 'UI';
import { selectionHandlers } from 'V2/Components/PDFViewer';
import './scss/showToc.scss';

class ShowToc extends Component {
  scrollTo(tocElement, e) {
    e.preventDefault();
    this.props.scrollToToc(tocElement);
  }

  render() {
    if (!this.props.toc.length) {
      return (
        <div className="blank-state">
          <Icon icon="font" />
          <h4>{t('System', 'No Table of Contents')}</h4>
          <p>{t('System', 'No Table of Contents description')}</p>
        </div>
      );
    }

    const { documentScale } = this.props;

    return (
      <div className="toc">
        <ul className="toc-view">
          {this.props.toc.map((tocElement, index) => {
            const scaledToc = selectionHandlers.adjustSelectionsToScale(tocElement, documentScale);

            return (
              <li className={`toc-indent-${scaledToc.indentation}`} key={index}>
                <ShowIf if={!this.props.readOnly}>
                  <a
                    className="toc-view-link"
                    href="#"
                    onClick={this.scrollTo.bind(this, scaledToc)}
                  >
                    {scaledToc.label}
                    <span className="page-number">
                      {scaledToc.selectionRectangles[0] && scaledToc.selectionRectangles[0].page}
                    </span>
                  </a>
                </ShowIf>
                <ShowIf if={this.props.readOnly}>
                  <span className="toc-view-link">{scaledToc.label}</span>
                </ShowIf>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

ShowToc.defaultProps = {
  toc: [],
};

ShowToc.propTypes = {
  toc: PropTypes.array,
  readOnly: PropTypes.bool,
  scrollToToc: PropTypes.func,
  documentScale: PropTypes.number,
};

function mapDispatchToProps() {
  return { scrollToToc };
}

const mapStateToProps = store => ({ documentScale: store.documentViewer.documentScale });

export { ShowToc };
export default connect(mapStateToProps, mapDispatchToProps)(ShowToc);
