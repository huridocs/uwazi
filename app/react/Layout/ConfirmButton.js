import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ConfirmModal from './ConfirmModal';

class ConfirmButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
    this.openModal = this.openModal.bind(this);
    this.onAccept = this.onAccept.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  onAccept() {
    this.closeModal();
    this.props.action();
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal() {
    this.setState({ showModal: true });
  }

  render() {
    return (
      <>
        <button type="button" className={this.props.className} onClick={this.openModal}>
          {this.props.children}
        </button>
        {this.state.showModal && (
          <ConfirmModal
            message={this.props.message}
            title={this.props.title}
            onAccept={this.onAccept}
            onCancel={this.closeModal}
          />
        )}
      </>
    );
  }
}

ConfirmButton.defaultProps = {
  children: '',
  message: 'Are you sure you want to continue?',
  title: 'Confirm action',
  className: '',
  action: () => false,
};

ConfirmButton.propTypes = {
  action: PropTypes.func,
  message: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export default ConfirmButton;
