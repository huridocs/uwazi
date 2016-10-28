import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {MarkDown} from 'app/Forms';

export class Nested extends Component {

  constructor(props) {
    super(props);
    this.state = {value: this.parseValue(this.props.value)};
  }

  parseValue(rows = []) {
    if (!rows[0]) {
      return '';
    }

    let keys = Object.keys(rows[0]);
    let result = keys.join(' | ') + ' |\n';
    result += keys.map(() => '-').join(' | ') + ' |\n';
    result += rows.map((row) => {
      return keys.map((key) => row[key].join(',')).join(' | ');
    }).join(' |\n') + ' |';

    return result;
  }

  onChange(e) {
    let value = e.target.value || '';
    let formatedValues = [];
    this.setState({value});
    if (value) {
      let rows = value.split('\n').filter((row) => row);
      let keys = rows[0].split('|').map((key) => key.trim()).filter((key) => key);
      let entries = rows.splice(2);
      formatedValues = entries.map((row) => {
        return row.split('|').reduce((result, val, index) => {
          if (!keys[index]) {
            return result;
          }
          let values = val.split(',').map((v) => v.trim()).filter((v) => v);
          result[keys[index]] = values;
          return result;
        }, {});
      });
    }

    this.props.onChange(formatedValues);
  }

  render() {
    return <MarkDown onChange={this.onChange.bind(this)} value={this.state.value}/>;
  }

}

Nested.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.array
};

export default Nested;

const NestedField = createFieldClass({
  Nested: controls.textarea
});

export {NestedField};
