import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

class Footer extends Component {

  render() {
    return (
      <footer>
          <ul className="footer-nav">

            <li className="footer-nav_item footer-powered">
              <div className="footer-powered_tooltip">
                <p>Uwazi is developed by HURIDOCS</p>
                <p>in Kenya, Ecuador, Spain, Germany and USA.</p>
              </div>
              <p className="footer-powered_title">Powered by</p>
              <a href="http://www.uwazidocs.org/" className="footer-powered_logo">Uwazi</a>
            </li>

            <li className="footer-nav_separator">&nbsp;</li>

            <li className="footer-nav_item footer-collection_name">
              <span>{this.props.siteName}</span>
            </li>

            <li className="footer-nav_separator">&nbsp;</li>

            <li className="footer-nav_item">
              <Link to="/">Library</Link>
            </li>
            <li className="footer-nav_item">
              <Link to="/uploads">Uploads</Link>
            </li>
            {(() => {
              if (!this.props.user._id) {
                return <li className="footer-nav_item">
                        <Link to="/login">Login</Link>
                       </li>;
              }

              return <li className="footer-nav_item">
                <Link to="/settings">Settings</Link>
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

export function mapStateToProps(state) {
  return {
    user: state.user.toJS(),
    siteName: state.settings.collection.toJS().site_name
  };
}

export default connect(mapStateToProps)(Footer);
