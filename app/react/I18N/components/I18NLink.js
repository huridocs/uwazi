import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

export class I18NLink extends Component {

  sanitize(url) {
    return url.replace(/\/+/g, '/');
  }

  render() {
    let locale = this.props.locale || '';
    let to = this.sanitize(`/${locale}/${this.props.to}`);
    return <Link to={to} className={this.props.className} onClick={this.props.onClick}>{this.props.children}</Link>;
  }
}

I18NLink.propTypes = {
  locale: PropTypes.string,
  children: PropTypes.any,
  to: PropTypes.string,
  activeClass: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    locale: state.locale
  };
}

export default connect(mapStateToProps)(I18NLink);
