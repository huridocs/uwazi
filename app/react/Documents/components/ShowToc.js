import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { scrollTo } from 'app/Viewer/actions/uiActions';
import Immutable from 'immutable';
import ShowIf from 'app/App/ShowIf';
import { t } from 'app/I18N';
import { Icon } from 'UI';

export class ShowToc extends Component {
  scrollTo(tocElement, e) {
    e.preventDefault();
    this.props.scrollTo(tocElement.toJS(), this.props.pdfInfo, 'span');
  }

  render() {
    const toc = Immutable.fromJS(this.props.toc);

    if (!toc.size) {
      return (
        <div className="blank-state">
          <Icon icon="font" />
          <h4>{t('System', 'No Table of Contents')}</h4>
          <p>{t('System', 'No Table of Contents description')}</p>
        </div>
      );
    }

    return (
      <div className="toc">
        <ul className="toc-view">
          {toc.map((tocElement, index) => (
            <li className={`toc-indent-${tocElement.get('indentation')}`} key={index}>
              <ShowIf if={!this.props.readOnly}>
                <a
                  className="toc-view-link"
                  href="#"
                  onClick={this.scrollTo.bind(this, tocElement)}
                >
                  {tocElement.get('label')}
                </a>
              </ShowIf>
              <ShowIf if={this.props.readOnly}>
                <span className="toc-view-link">{tocElement.get('label')}</span>
              </ShowIf>
            </li>
          ))}
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
  pdfInfo: PropTypes.object,
  scrollTo: PropTypes.func,
};

function mapDispatchToProps() {
  return { scrollTo };
}

export default connect(null, mapDispatchToProps)(ShowToc);
