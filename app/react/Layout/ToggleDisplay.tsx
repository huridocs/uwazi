import PropTypes from 'prop-types';
import React from 'react';

class ToggleDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: props.open,
    };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  show() {
    this.setState({ show: true });
  }

  hide() {
    this.setState({ show: false });
    this.props.onHide();
  }

  render() {
    return (
      <>
        {!this.state.show && <button onClick={this.show}>{this.props.showLabel}</button>}
        {this.state.show && <button onClick={this.hide}>{this.props.hideLabel}</button>}
        {this.state.show && this.props.children}
      </>
    );
  }
}

ToggleDisplay.defaultProps = {
  onHide: () => {},
  showLabel: 'show',
  hideLabel: 'hide',
  open: false,
};

const labelType = PropTypes.oneOfType([PropTypes.string, PropTypes.element]);

ToggleDisplay.propTypes = {
  children: PropTypes.element.isRequired,
  onHide: PropTypes.func,
  showLabel: labelType,
  hideLabel: labelType,
  open: PropTypes.bool,
};

export default ToggleDisplay;
