/** @format */

import PropTypes, { InferProps } from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import objectWithoutKeys from 'app/utils/objectWithoutKeys';

const I18NLinkPropTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.any,
};

type I18NLinkProps = InferProps<typeof I18NLinkPropTypes>;

export class I18NLink extends Component<I18NLinkProps> {
  static defaultProps: I18NLinkProps;
  constructor(props: I18NLinkProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e: { preventDefault: () => void }) {
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

export function mapStateToProps({ locale }: { locale?: string }, ownProps: any) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}

export default connect(mapStateToProps)(I18NLink);
