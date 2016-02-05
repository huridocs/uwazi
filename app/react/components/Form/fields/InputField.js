import React, { Component, PropTypes } from 'react'

class InputField extends Component {

  constructor(props) {
    super(props),
    this.state = {value: props.value};
  };

  value = () => {
    return this.field.value
  };

  handleChange = () => {
    this.setState({value: this.value()});
  };

  componentDidUpdate = (prevProps) => {
    if(prevProps.value !== this.props.value){
      this.setState({value:this.props.value});
    }
  };

  render = () => {
    return (
      <div className="form-group">
        {(()=>{
          if(this.props.label){
            return <label htmlFor="label">{this.props.label}</label>
          }
        })()}
        <div>
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
  };

}
export default InputField;
