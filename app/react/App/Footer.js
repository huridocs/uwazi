import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {I18NLink, t} from 'app/I18N';
import {createSelector} from 'reselect';
import {NeedAuthorization} from 'app/Auth';

class Footer extends Component {

  render() {
    return (
      <footer>
          <ul className="footer-nav">

            <li className="footer-nav_item">
              <div className="footer-tooltip">
                <p>Uwazi is developed by <img src="/public/huridocs-logo.svg" title="uwazi" alt="uwazi"/></p>
                <p>in Kenya, Ecuador, Spain, Germany and USA.</p>
              </div>
              <a href="https://www.uwazi.io/" target="_blank" className="footer-logo">
                <img src="/public/logo.svg" title="uwazi" alt="uwazi"/>
              </a>
            </li>

            <li className="footer-nav_separator">&nbsp;</li>

            <li className="footer-nav_item footer-collection_name">
              <span>{this.props.siteName}</span>
            </li>

            <li className="footer-nav_separator">&nbsp;</li>

            <li className="footer-nav_item">
              <I18NLink to="/">{t('System', 'Library')}</I18NLink>
            </li>
            <NeedAuthorization roles={['admin', 'editor']}>
              <li className="footer-nav_item">
                <I18NLink to="/uploads">{t('System', 'Uploads')}</I18NLink>
              </li>
            </NeedAuthorization>
            {(() => {
              if (!this.props.user._id) {
                return <li className="footer-nav_item">
                        <I18NLink to="/login">{t('System', 'Login')}</I18NLink>
                       </li>;
              }

              return <li className="footer-nav_item">
                <I18NLink to="/settings">{t('System', 'Settings')}</I18NLink>
              </li>;
            })()}

          </ul>
        </footer>
    );
  }
}

Footer.propTypes = {
  user: PropTypes.object,
  siteName: PropTypes.string
};


const selectUser = createSelector(s => s.user, u => u.toJS());

export function mapStateToProps(state) {
  return {
    user: selectUser(state),
    siteName: state.settings.collection.get('site_name')
  };
}

export default connect(mapStateToProps)(Footer);
