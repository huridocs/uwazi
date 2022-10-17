/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import objectWithoutKeys from 'app/utils/objectWithoutKeys';
import t from '../t';

const defaultProps = {
  disabled: false,
  onClick: (_e: any) => {},
  confirmTitle: '',
  confirmMessage: '',
  component: 'link',
};

export type I18NLinkProps = typeof defaultProps & {
  to: string;
  disabled: boolean;
  onClick: (_e: any) => void;
  confirmTitle: string;
  confirmMessage: string;
  component?: string; // button or link
};

export class I18NLink extends Component<I18NLinkProps> {
  static defaultProps = defaultProps;

  static contextTypes = {
    confirm: PropTypes.func,
  };

  static navigate(to: string) {
    browserHistory.push(to);
  }

  constructor(props: I18NLinkProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e: { preventDefault: () => void }) {
    const { to, disabled, onClick, confirmTitle, confirmMessage } = this.props;
    e.preventDefault();
    if (disabled) {
      return;
    }

    if (onClick) {
      if (confirmTitle) {
        this.context.confirm({
          accept: () => {
            onClick(e);
            I18NLink.navigate(to);
          },
          title: confirmTitle,
          message: confirmMessage,
        });
      } else {
        onClick(e);
        I18NLink.navigate(to);
      }
    }
  }

  render() {
    const { component } = this.props;
    const props = objectWithoutKeys(this.props, [
      'dispatch',
      'onClick',
      'confirmTitle',
      'confirmMessage',
      'component',
    ]);
    if (component === 'button') {
      const buttonProps = objectWithoutKeys(props, ['to']);
      return <button type="button" onClick={this.onClick} {...buttonProps} />;
    }
    return <Link onClick={this.onClick} {...props} />;
  }
}

export function mapStateToProps({ locale }: { locale?: string }, ownProps: any) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}

export default connect(mapStateToProps)(I18NLink);
