/* eslint-disable max-len */
import React, { Component } from 'react';

interface NoticeState {
  isHidden: boolean;
}

type NoticeProps = {
  title: String;
  allowClose?: boolean;
  children?: any;
};

const defaultProps = {
  allowClose: true,
  children: '',
};

export class Notice extends Component<NoticeProps, NoticeState> {
  static defaultProps = defaultProps;

  static learnIconSvg() {
    return (
      <svg
        width="29"
        height="29"
        viewBox="0 0 29 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14.5" cy="14.5" r="14.5" fill="#2B56C1" />
        <path
          d="M14.8971 16.9227C14.8314 16.9446 14.7657 16.9665 14.7 16.9665C14.6343 16.9665 14.5686 16.9446 14.503 16.9227L7.86842 14.3389V18.1927C7.86842 20.8202 12.6418 21.1048 14.7 21.1048C16.7583 21.1048 21.5316 20.8202 21.5316 18.1927V14.3389L14.8971 16.9227Z"
          fill="#FAFBFF"
        />
        <path
          d="M24.1372 11.6238L14.8533 8.03284C14.7438 7.98905 14.6343 7.98905 14.5467 8.03284L5.28465 11.6238C5.10948 11.6895 5 11.8428 5 12.0398C5 12.2369 5.10948 12.3902 5.28465 12.4559L14.5467 16.0249C14.5905 16.0468 14.6562 16.0468 14.7 16.0468C14.7438 16.0468 14.8095 16.0468 14.8533 16.0249L24.1154 12.4559C24.2905 12.3902 24.4 12.2369 24.4 12.0398C24.4 11.8428 24.2905 11.6895 24.1372 11.6238Z"
          fill="#FAFBFF"
        />
      </svg>
    );
  }

  constructor(props: NoticeProps) {
    super(props);
    this.state = {
      isHidden: false,
    };

    this.close = this.close.bind(this);
  }

  close() {
    this.setState({ isHidden: true });
  }

  render() {
    const { children, title, allowClose } = this.props;
    const { isHidden } = this.state;

    return (
      <div className={`notice ${isHidden ? 'is-hidden' : ''}`}>
        <div className="header">
          <span className="icon">{Notice.learnIconSvg()}</span>
          <span className="title">{title}</span>
          {allowClose && (
            <button className="close-notice" onClick={this.close} type="button" no-translate>
              X
            </button>
          )}
        </div>
        <div className="main">{children}</div>
      </div>
    );
  }
}
