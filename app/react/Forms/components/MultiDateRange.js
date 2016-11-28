import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import DatePicker from './DatePicker';

export class MultiDateRange extends Component {

  constructor(props) {
    super(props);
    let values = this.props.value.length ? this.props.value : [{from: null, to: null}];
    this.state = {values};
  }

  fromChange(index, value) {
    let values = this.state.values.slice();
    values[index] = Object.assign({}, values[index]);
    values[index].from = value;
    this.setState({values});
    this.props.onChange(values);
  }

  toChange(index, value) {
    let values = this.state.values.slice();
    values[index] = Object.assign({}, values[index]);
    values[index].to = value;
    this.setState({values});
    this.props.onChange(values);
  }

  add(e) {
    e.preventDefault();
    let values = this.state.values.slice();
    values.push({from: null, to: null});
    this.setState({values});
  }

  remove(index, e) {
    e.preventDefault();
    let values = this.state.values.slice();
    values.splice(index, 1);
    this.setState({values});
    this.props.onChange(values);
  }

  render() {
    return <div className="multidate">
      {(() => {
        return this.state.values.map((value, index) => {
          return <div key={index} className="multidate-item">
                  <div className="multidate-range">
                    <div className="DatePicker__From">
                      <span>From:&nbsp;</span>
                        <DatePicker value={value.from} onChange={this.fromChange.bind(this, index)}/>
                    </div>
                    <div className="DatePicker__To">
                      <span>&nbsp;To:&nbsp;</span>
                        <DatePicker value={value.to} endOfDay={true} onChange={this.toChange.bind(this, index)}/>
                    </div>
                    <button className="react-datepicker__close-icon" onClick={this.remove.bind(this, index)}></button>
                  </div>
                 </div>;
        });
      })()}
      <button className="btn btn-success add" onClick={this.add.bind(this)}>
        <i className="fa fa-plus"></i>&nbsp;
        <span>Add date</span>
      </button>
    </div>;
  }

}

MultiDateRange.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func
};

export default MultiDateRange;

const MultiDateRangeField = createFieldClass({
  MultiDateRange: controls.select
});

export {MultiDateRangeField};
