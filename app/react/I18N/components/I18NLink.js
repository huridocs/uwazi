import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import objectWithoutKeys from 'app/utils/objectWithoutKeys';

export class I18NLink extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    if (this.props.disabled) {
      e.preventDefault();
      return;
    }

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  render() {
    const props = objectWithoutKeys(this.props, ['dispatch', 'onClick']);

    return <Link onClick={this.onClick} {...props} />;
  }
}

I18NLink.defaultProps = {
  disabled: false,
  onClick: undefined,
};

I18NLink.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export function mapStateToProps({ locale }, ownProps) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}

export default connect(mapStateToProps)(I18NLink);
