import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TwitterPicker } from 'react-color';

import { COLORS } from 'app/utils/colors';

class ColorPicker extends Component {
  constructor(props) {
    super(props);
    this.state = { active: false };
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onColorChange = this.onColorChange.bind(this);
  }

  onColorChange({ hex }) {
    const { onChange } = this.props;
    onChange(hex);
  }

  onButtonClick() {
    this.setState(oldState => ({ active: !oldState.active }));
  }

  onBlur() {
    this.setState({ active: false });
  }

  render() {
    const { active } = this.state;
    const { value, defaultValue } = this.props;
    return (
      <div className="ColorPicker">
        <div
          className="ColorPicker__button"
          style={{ backgroundColor: value || defaultValue }}
          onClick={this.props.disabled ? () => {} : this.onButtonClick}
        />
        {active && (
          <div className="ColorPicker__popover">
            <div className="ColorPicker__cover" onClick={this.onBlur} />
            <TwitterPicker
              color={value || defaultValue}
              colors={COLORS}
              onChangeComplete={this.onColorChange}
            />
          </div>
        )}
      </div>
    );
  }
}

ColorPicker.defaultProps = {
  value: '',
  defaultValue: '',
  disabled: false,
};

ColorPicker.propTypes = {
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ColorPicker;
