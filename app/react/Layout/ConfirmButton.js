import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Confirm from '../App/Confirm';

class ConfirmButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.openModal = this.openModal.bind(this);
  }

  openModal() {
    this.setState({ showModal: true });
  }

  render() {
    return (
      <React.Fragment>
        <button onClick={this.openModal}>{this.props.children}</button>
        {this.state.showModal && <Confirm accept={() => this.setState({ showModal: false })}/>}
      </React.Fragment>
    );
  }
}

ConfirmButton.defaultProps = {
  children: ''
};

ConfirmButton.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ])
};

export default ConfirmButton;
