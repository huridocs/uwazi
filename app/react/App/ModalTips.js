import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';
import Modal from 'app/Layout/Modal';
// eslint-disable-next-line import/exports-last
export default class ModalTips extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  render() {
    return (
      <>
        <div className="modal-tip-label" onClick={() => this.setState({ isOpen: true })}>
          {this.props.label}
        </div>
        <Modal isOpen={this.state.isOpen} type={this.props.type} className="modal-tip-dim">
          <Modal.Body>
            <h4>{this.props.title}</h4>
            {this.props.children}
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn confirm-button btn-info"
              onClick={() => this.setState({ isOpen: false })}
            >
              {t('System', 'Accept')}
            </button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

ModalTips.defaultProps = {
  type: 'info',
};

ModalTips.propTypes = {
  type: PropTypes.string,
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};
