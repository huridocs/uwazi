import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink, t } from 'app/I18N';
import { createSelector } from 'reselect';
import { libraryViewInfo } from 'app/App/libraryViewInfo';

const getLibraryURL = libraryView =>
  libraryViewInfo[libraryView] ? `/${libraryViewInfo[libraryView].url}` : '/library';

class Footer extends Component {
  render() {
    return (
      <footer>
        <ul className="footer-nav">
          <li className="footer-nav_item">
            <div className="footer-tooltip">
              <p>
                Uwazi is developed by{' '}
                <a href="https://huridocs.org/" target="_blank">
                  <img
                    src="/public/huridocs-logo.svg"
                    title="HURIDOCS"
                    alt="Human Rights Information and Documentation Systems"
                  />
                </a>
              </p>
            </div>
            <a href="https://www.uwazi.io/" target="_blank" className="footer-logo">
              <img src="/public/logo.svg" title="uwazi" alt="uwazi" />
            </a>
          </li>

          <li className="footer-nav_separator">&nbsp;</li>

          <li className="footer-nav_item footer-collection_name">
            <span>{this.props.siteName}</span>
          </li>

          <li className="footer-nav_separator">&nbsp;</li>

          <li className="footer-nav_item">
            <I18NLink to={getLibraryURL(this.props.defaultLibraryView)}>
              {t('System', 'Library')}
            </I18NLink>
          </li>
          {(() => {
            if (!this.props.user._id) {
              return (
                <li className="footer-nav_item">
                  <I18NLink to="/login">{t('System', 'Login')}</I18NLink>
                </li>
              );
            }

            return (
              <li className="footer-nav_item">
                <I18NLink to="/settings/account">{t('System', 'Settings')}</I18NLink>
              </li>
            );
          })()}
        </ul>
      </footer>
    );
  }
}

Footer.propTypes = {
  user: PropTypes.object,
  siteName: PropTypes.string,
  defaultLibraryView: PropTypes.string,
};

Footer.defaultProps = {
  defaultLibraryView: 'cards',
};

const selectUser = createSelector(
  s => s.user,
  u => u.toJS()
);

export function mapStateToProps(state) {
  return {
    user: selectUser(state),
    siteName: state.settings.collection.get('site_name'),
    defaultLibraryView: state.settings.collection.get('defaultLibraryView'),
  };
}

export default connect(mapStateToProps)(Footer);
