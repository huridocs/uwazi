import React, { Component, PropTypes } from 'react'

class SelectField extends Component {

  constructor(props) {
    super(props),
    this.state = {value: props.value};
  };

  value = () => {
    return this.field.value;
  };

  handleChange = () => {
    this.setState({value:this.value()});
    if(this.props.onChange){
      this.props.onChange();
    }
  };

  componentDidUpdate = (prevProps) => {
    if(prevProps.value !== this.props.value){
      this.setState({value:this.props.value});
    }
  };

  render = () => {

    let selectOptions = this.props.options || [];
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="select" className="col-sm-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <select className="form-control" id="select" onChange={this.handleChange} value={this.state.value} defaultValue={this.props.defaultValue} ref={(ref) => {this.field = ref}}>
            {selectOptions.map((data, index) => {
              return <option key={index} value={data.value}>{data.label}</option>
            })}
          </select>
        </div>
      </div>
    )
  };

}
export default SelectField;
