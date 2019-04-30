import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TwitterPicker } from 'react-color';

const COLORS = [
  '#C03B22', '#D9534F', '#E91E63', '#A03AB1',
  '#6F46B8', '#3F51B5', '#2196F3', '#37BDCf',
  '#359990', '#5CB85C', '#8BC34A', '#CDDC39',
  '#CCBC2F', '#F0AD4E', '#EC9920', '#E46841',
  '#795548', '#9E9E9E', '#607D8B'
];

class ColorPicker extends Component {
  constructor(props) {
    super(props);
    this.state = { color: props.value, active: false };
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onColorChange = this.onColorChange.bind(this);
  }

  onColorChange({ hex }) {
    const { onChange } = this.props;
    this.setState({ color: hex });
    onChange(hex);
  }

  onButtonClick() {
    this.setState(oldState => ({ active: !oldState.active }));
  }

  onBlur() {
    this.setState({ active: false });
  }

  render() {
    const { color, active } = this.state;
    return (
      <div className="ColorPicker">
        <div
          className="ColorPicker__button"
          style={{ backgroundColor: color }}
          onClick={this.onButtonClick}
        />
        {active && (
          <div className="ColorPicker__popover">
            <div className="ColorPicker__cover" onClick={this.onBlur}/>
            <TwitterPicker
              color={color}
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
  value: ''
};

ColorPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default ColorPicker;
