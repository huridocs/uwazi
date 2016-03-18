import React, {Component, PropTypes} from 'react';

class SelectField extends Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  value() {
    return this.field.value;
  }

  handleChange() {
    this.setState({value: this.value()});
    if (this.props.onChange) {
      this.props.onChange();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({value: this.props.value});
    }
  }

  render() {
    let selectOptions = this.props.options || [];
    return (
      <div className="form-group">
        <label htmlFor="select">{this.props.label}</label>
        <div>
          <select className="form-control" id="select"
            onChange={this.handleChange.bind(this)}
            value={this.state.value}
            defaultValue={this.props.defaultValue}
            ref={(ref) => this.field = ref}
          >
            {selectOptions.map((data, index) => {
              return <option key={index} value={data.value}>{data.label}</option>;
            })}
          </select>
        </div>
      </div>
    );
  }
}

SelectField.propTypes = {
  label: PropTypes.string,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  options: PropTypes.array,
  onChange: PropTypes.func
};

export default SelectField;
