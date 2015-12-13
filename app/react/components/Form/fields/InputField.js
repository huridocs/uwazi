import React, { Component, PropTypes } from 'react'

class InputField extends Component {

  constructor(props) {
    super(props),
    this.state = {value: props.value};
  }

  value = () => {
    return this.field.value
  }

  handleChange = () => {
    this.setState({value: this.value()});
  }

  componentDidUpdate = (prevProps) => {
    if(prevProps.value !== this.props.value){
      this.setState({value:this.props.value});
    }
  }

  render = () => {
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="label" className="col-xs-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <input type="text"
            className="form-control"
            id="label"
            ref={(ref) => this.field = ref}
            defaultValue={this.props.defaultValue}
            value={this.state.value}
            onChange={this.handleChange}
            placeholder="placeholder"
          />
        </div>
      </div>
    )
  }

}
export default InputField;
